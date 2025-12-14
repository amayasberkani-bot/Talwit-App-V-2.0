
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Mood, UserContext } from '../types';
import { chatWithCompanion, generateDailyGreeting } from '../services/geminiService'; // Added greeting generator
import { saveChatMessage, subscribeToChatHistory, addAgendaItem, auth, getUserPreferences, deleteChatPair } from '../services/firebase'; 
import { useSettings } from '../contexts/SettingsContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { STYLES, Mascot, ANIMATIONS, TYPOGRAPHY } from '../constants';
import { Send, Volume2, VolumeX, Paperclip, X, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatCompanionProps {
  currentMood: Mood | null;
  userContext?: UserContext | null;
}

const ChatCompanion: React.FC<ChatCompanionProps> = ({ currentMood, userContext: initialUserContext }) => {
  const { settings, t } = useSettings(); // Use translations
  const { recentActions } = useAnalytics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGreetingLoading, setIsGreetingLoading] = useState(false); // Track greeting state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); 
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = auth.currentUser;

  // --- 1. Real-time Subscription to Firestore ---
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToChatHistory(currentUser.uid, (fetchedMessages) => {
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- 2. Dynamic Initial Greeting (Only if history is empty) ---
  useEffect(() => {
    if (!currentUser) return;
    
    // Allow a small delay to ensure subscription has returned data
    const timer = setTimeout(async () => {
         if (messages.length === 0 && !isLoading && !isGreetingLoading) {
            setIsGreetingLoading(true);
            try {
                // Generate Dynamic Greeting using AI
                const greeting = await generateDailyGreeting(initialUserContext || null, settings.language);
                await saveChatMessage(currentUser.uid, greeting, 'model');
            } catch (e) {
                console.error("Greeting failed", e);
            } finally {
                setIsGreetingLoading(false);
            }
         }
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentUser, messages.length, settings.language]); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isGreetingLoading, selectedImage]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Strip markdown chars for speech
    const cleanText = text.replace(/[|#-]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    
    let langCode = settings.language === 'ar' ? 'ar' : settings.language === 'fr' ? 'fr' : 'en';
    const preferredVoice = voices.find(v => v.lang.includes(langCode) && (v.name.includes("Female") || v.name.includes("Samantha"))) || voices.find(v => v.lang.includes(langCode));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.9; 
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const clearImage = () => {
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- SMART DELETE FEATURE ---
  const handleDeleteMessage = async (msgId: string, index: number) => {
      if(!currentUser) return;
      setDeletingId(msgId);
      
      try {
          // Logic: Check if next message is AI
          const nextMsg = messages[index + 1];
          const aiResponseId = (nextMsg && nextMsg.role === 'model') ? nextMsg.id : undefined;

          // Call Batch Delete Service
          await deleteChatPair(currentUser.uid, msgId, aiResponseId);
      } catch (err) {
          console.error("Failed to delete chat pair", err);
      } finally {
          setDeletingId(null);
      }
  };

  const processAIResponse = async (fullText: string) => {
    if (!currentUser) return;

    let cleanText = fullText;
    let linkedAgendaId = null;
    
    // Regex to find JSON block: ```json ... ```
    const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.action === 'ADD_AGENDA' && data.title && data.date) {
          // Trigger Agenda Save & Capture ID
          const newAgendaId = await addAgendaItem(currentUser.uid, {
            title: data.title,
            type: data.type || 'task',
            date: new Date(data.date), // Expecting YYYY-MM-DD
            isCompleted: false
          });
          
          if (newAgendaId) {
             console.log("Automatically added to agenda with ID:", newAgendaId);
             linkedAgendaId = newAgendaId;
          }
        }
        // Remove JSON block from the text displayed to user
        cleanText = fullText.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse AI JSON:", e);
        // If parsing fails, just show the text as is (or partial clean)
      }
    }

    // 3. Save Clean AI Message to Firestore (passing the linked agenda ID if created)
    await saveChatMessage(currentUser.uid, cleanText, 'model', null, linkedAgendaId);

    speakText(cleanText);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !currentUser) return;

    const rawBase64 = selectedImage ? selectedImage.split(',')[1] : undefined;
    const userText = input;
    const attachment = selectedImage;

    // Clear UI immediately
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // 1. Save User Message to Firestore
      await saveChatMessage(currentUser.uid, userText, 'user', attachment);

      // --- FEATURE: CONTEXT INJECTION ---
      // Fetch fresh preferences from Firestore to ensure AI knows latest survey answers
      let contextToUse = initialUserContext;
      try {
          const freshPrefs = await getUserPreferences(currentUser.uid);
          if (freshPrefs) contextToUse = freshPrefs;
      } catch (e) {
          console.warn("Could not fetch fresh preferences, using local prop.", e);
      }

      // 2. Get AI Response
      const moodContext = currentMood || 'neutral';
      const responseText = await chatWithCompanion(
          userText, 
          moodContext, 
          contextToUse || undefined, // Use the freshly fetched context
          settings.language, 
          recentActions,
          rawBase64 
      );
      
      // 3. Process Response (Check for Agenda JSON & Link)
      await processAIResponse(responseText);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper Functions for Formatting ---

  const isSameDay = (d1: number, d2: number) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const formatDateLabel = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // --- Rendering Logic ---

  const renderChatMessages = (messagesArray: ChatMessage[]) => {
    return messagesArray.map((msg, index) => {
        const isNewDay = index === 0 || !isSameDay(messagesArray[index - 1].timestamp, msg.timestamp);

        return (
            <React.Fragment key={msg.id}>
                {/* Date Label Separator */}
                {isNewDay && (
                    <div className="w-full flex justify-center my-6">
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--card-bg)] border border-[var(--card-border)] px-3 py-1 rounded-full shadow-sm backdrop-blur-md opacity-80 uppercase tracking-wide">
                            {formatDateLabel(msg.timestamp)}
                        </span>
                    </div>
                )}

                {/* Message Bubble */}
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                    {/* Image Attachment Display */}
                    {msg.attachment && (
                        <div className="mb-2 max-w-[200px] rounded-xl overflow-hidden border border-[var(--card-border)] shadow-sm">
                            <img src={msg.attachment} alt="User upload" className="w-full h-auto object-cover" />
                        </div>
                    )}

                    <div className="flex items-end gap-2 max-w-[90%] md:max-w-[85%]">
                        {/* Trash Icon for User Messages (Smart Delete) */}
                        {msg.role === 'user' && (
                            <button 
                                onClick={() => handleDeleteMessage(msg.id, index)}
                                disabled={deletingId === msg.id}
                                className={`
                                    p-1.5 rounded-full text-red-300 hover:text-red-500 hover:bg-red-50 
                                    transition-all opacity-0 group-hover:opacity-100 focus:opacity-100
                                    ${deletingId === msg.id ? 'opacity-100 animate-pulse' : ''}
                                `}
                                title="Delete this message (and AI response)"
                            >
                                {deletingId === msg.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                        )}

                        <div
                            className={`p-3 pl-4 pr-3 rounded-2xl text-sm leading-relaxed shadow-sm border border-transparent relative min-w-[100px] ${
                                msg.role === 'user'
                                ? 'bg-[var(--primary)] text-[var(--text-on-primary)] rounded-br-none'
                                : 'bg-[var(--input-bg)] text-[var(--text-main)] rounded-bl-none border-[var(--card-border)]'
                            }`}
                        >
                             {/* 
                                REGRESSION SAFETY PROTOCOL: 
                                Wrapping text in overflow-x-auto to handle Markdown Tables correctly 
                                as requested.
                             */}
                             <div className="overflow-x-auto whitespace-pre-line break-words" dir="auto">
                                {msg.text}
                             </div>

                             {/* Message Timestamp */}
                             <span className={`text-[10px] block text-right mt-1 font-medium ${
                                 msg.role === 'user' 
                                 ? 'text-[var(--text-on-primary)] opacity-70' 
                                 : 'text-[var(--text-muted)]'
                             }`}>
                                 {formatTime(msg.timestamp)}
                             </span>
                        </div>
                    </div>
                </motion.div>
            </React.Fragment>
        );
    });
  };

  return (
    <div className={`flex flex-col h-[500px] md:h-[600px] ${STYLES.glassCard} overflow-hidden`}>
      <div className="p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Mascot mood={currentMood || 'happy'} className="w-10 h-10" />
            <div>
                <h3 className={TYPOGRAPHY.h3}>{t('chat.title')}</h3>
                <p className={TYPOGRAPHY.caption}>{t('chat.subtitle')}</p>
            </div>
        </div>
        <motion.button 
            whileTap={ANIMATIONS.tap}
            onClick={() => {
                const newState = !voiceEnabled;
                setVoiceEnabled(newState);
                if (!newState) window.speechSynthesis.cancel();
            }}
            className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'bg-[var(--primary)] text-[var(--text-on-primary)]' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}
        >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <AnimatePresence initial={false}>
            {renderChatMessages(messages)}
        </AnimatePresence>
        
        {/* Loading Indicator for Chat or Greeting */}
        {(isLoading || isGreetingLoading) && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start mt-2"
          >
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-sm">
              {[0, 1, 2].map((i) => (
                  <motion.div 
                    key={i}
                    className="w-2 h-2 bg-[var(--primary)] rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                    }}
                  />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[var(--card-bg)]/30 border-t border-[var(--card-border)]">
        
        {/* Image Preview Overlay */}
        <AnimatePresence>
            {selectedImage && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-3 relative inline-block"
                >
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-[var(--primary)] shadow-sm">
                        <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button 
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                    >
                        <X size={12} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex gap-2 items-center">
            {/* File Upload Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[var(--primary)] transition-colors"
                title="Upload Schedule Image"
            >
                <Paperclip size={20} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
            />

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('chat.placeholder')}
                className={`${STYLES.glassInput} flex-1 px-4 py-2 text-sm`}
                disabled={isLoading}
            />
            <motion.button
                whileTap={ANIMATIONS.tap}
                whileHover={!input.trim() && !selectedImage ? {} : { scale: 1.05 }}
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`${STYLES.primaryButton} p-2 rounded-xl ${settings.language === 'ar' ? 'rotate-180' : ''}`}
            >
                <Send className="w-5 h-5" />
            </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatCompanion;

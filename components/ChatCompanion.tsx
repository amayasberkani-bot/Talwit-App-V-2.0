import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Mood, UserContext } from '../types';
import { chatWithCompanion } from '../services/geminiService';
import { STYLES, Mascot, ANIMATIONS } from '../constants';
import { Send, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatCompanionProps {
  currentMood: Mood | null;
  userContext?: UserContext | null;
}

const ChatCompanion: React.FC<ChatCompanionProps> = ({ currentMood, userContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: userContext 
        ? `Hi ${userContext.name}! I remember you're focusing on ${userContext.studyField} right now. How are you feeling about your workload?`
        : "Hi there! I'm Talwit. I'm here to help you study and stay balanced. How are you feeling about your workload today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Scroll when loading state changes too

  // Speech Synthesis Helper
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.9; 
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const moodContext = currentMood || 'neutral';
      const responseText = await chatWithCompanion(userMsg.text, moodContext, userContext || undefined);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      speakText(responseText);

    } catch (err) {
      // Error handled in service
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-[500px] md:h-[600px] ${STYLES.glassCard} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-white/40 bg-white/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Mascot mood={currentMood || 'happy'} className="w-10 h-10" />
            <div>
                <h3 className="font-semibold text-gray-800">Talwit Companion</h3>
                <p className="text-xs text-gray-500">Always here to listen</p>
            </div>
        </div>
        <motion.button 
            whileTap={ANIMATIONS.tap}
            onClick={() => {
                const newState = !voiceEnabled;
                setVoiceEnabled(newState);
                if (!newState) window.speechSynthesis.cancel();
            }}
            className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'bg-[#66DCDC] text-white' : 'bg-white/50 text-gray-500'}`}
            title="Toggle Voice Output"
        >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </motion.button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
            {messages.map((msg) => (
            <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div
                className={`max-w-[85%] md:max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                    ? 'bg-[#66DCDC] text-white rounded-br-none shadow-md'
                    : 'bg-white/70 text-gray-800 rounded-bl-none shadow-sm'
                }`}
                >
                {msg.text}
                </div>
            </motion.div>
            ))}
        </AnimatePresence>
        
        {/* Organic Loading State */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/50 p-4 rounded-2xl rounded-bl-none flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                  <motion.div 
                    key={i}
                    className="w-2 h-2 bg-[#66DCDC] rounded-full"
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

      {/* Input */}
      <div className="p-4 bg-white/30 border-t border-white/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for advice or vent..."
            className={`${STYLES.glassInput} flex-1 px-4 py-2 text-sm bg-white/80`}
            disabled={isLoading}
          />
          <motion.button
            whileTap={ANIMATIONS.tap}
            whileHover={!input.trim() ? {} : { scale: 1.05 }}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`${STYLES.primaryButton} p-2 rounded-xl`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatCompanion;


import React, { useState, useRef, useEffect } from 'react';
import { generateScheduleFromImage } from '../services/geminiService';
import { WeeklySchedule, ScheduleBlock } from '../types';
import { STYLES, TYPOGRAPHY, Mascot } from '../constants';
import { Calendar, Upload, RefreshCw, Clock, Heart, BookOpen, Coffee, Gamepad2, X, Sparkles, AlertCircle, Edit2, Save, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useSettings } from '../contexts/SettingsContext';

const StudyPlanGenerator: React.FC = () => {
  const { t } = useSettings();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // State for Schedule
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [originalSchedule, setOriginalSchedule] = useState<WeeklySchedule | null>(null); // For AI Feedback Diffing
  
  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FEATURE: Auto-Load from Firestore ---
  useEffect(() => {
    const loadSavedPlan = async () => {
        if (!auth.currentUser) return;
        try {
            const docRef = doc(db, 'users', auth.currentUser.uid, 'currentPlan', 'weeklySchedule');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const savedSchedule = docSnap.data() as WeeklySchedule;
                if (savedSchedule) {
                    setSchedule(savedSchedule);
                    setOriginalSchedule(JSON.parse(JSON.stringify(savedSchedule))); // Deep copy for comparison
                    // Ensure active day exists
                    if (savedSchedule.days && savedSchedule.days.length > 0) {
                        setActiveDay(savedSchedule.days[0].day);
                    }
                }
            }
        } catch (err) {
            console.error("Error loading plan:", err);
        }
    };
    loadSavedPlan();
  }, []);

  // Cycle through loading messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 5); // 5 Steps defined in translations
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const getUserContext = () => {
      const saved = localStorage.getItem('talwit_user_context');
      return saved ? JSON.parse(saved) : null;
  };

  // --- 2. FEATURE: Auto-Save Logic ---
  const savePlanToFirestore = async (planData: WeeklySchedule) => {
      if (!auth.currentUser) return;
      try {
          await setDoc(doc(db, 'users', auth.currentUser.uid, 'currentPlan', 'weeklySchedule'), planData);
          console.log("Schedule auto-saved.");
      } catch (err) {
          console.error("Auto-save failed:", err);
      }
  };

  // --- 3. FEATURE: AI Feedback Loop (Capture Differences) ---
  const captureUserEdits = async (newSchedule: WeeklySchedule) => {
      if (!auth.currentUser || !originalSchedule) return;

      const changes: string[] = [];

      // Compare Original vs New
      if (newSchedule.days && Array.isArray(newSchedule.days)) {
          newSchedule.days.forEach(newDay => {
              const oldDay = originalSchedule.days?.find(d => d.day === newDay.day);
              if (!oldDay || !oldDay.blocks) return;

              newDay.blocks.forEach((newBlock, idx) => {
                  const oldBlock = oldDay.blocks[idx]; // Simplified: assuming index matching for now
                  if (!oldBlock) return;

                  // Check for specific field changes
                  if (newBlock.activity !== oldBlock.activity) {
                      changes.push(`Day ${newDay.day} @ ${newBlock.startTime}: Changed activity from "${oldBlock.activity}" to "${newBlock.activity}"`);
                  }
                  if (newBlock.type !== oldBlock.type) {
                      changes.push(`Day ${newDay.day} @ ${newBlock.startTime}: Changed type from "${oldBlock.type}" to "${newBlock.type}"`);
                  }
                  if (newBlock.startTime !== oldBlock.startTime || newBlock.endTime !== oldBlock.endTime) {
                      changes.push(`Day ${newDay.day}: Changed time of "${newBlock.activity}"`);
                  }
              });
          });
      }

      if (changes.length > 0) {
          try {
              // Save preferences/learnings
              await addDoc(collection(db, 'users', auth.currentUser.uid, 'ai_learning', 'preferences'), {
                  timestamp: serverTimestamp(),
                  type: 'schedule_edit',
                  changes: changes,
                  summary: `User manually modified ${changes.length} items in their schedule.`
              });
              console.log("AI Feedback captured:", changes);
          } catch (err) {
              console.error("Failed to capture AI feedback:", err);
          }
      }
  };

  const handleSaveEdits = async () => {
      if (!schedule) return;
      
      // 1. Capture what changed before we update the "Original"
      await captureUserEdits(schedule);

      // 2. Save new version to Firestore
      await savePlanToFirestore(schedule);

      // 3. Update local "Original" reference to current state
      setOriginalSchedule(JSON.parse(JSON.stringify(schedule)));
      
      setIsEditing(false);
  };

  const updateBlock = (dayIndex: number, blockIndex: number, field: keyof ScheduleBlock, value: string) => {
      if (!schedule || dayIndex === -1) return;
      const newSchedule = { ...schedule };
      
      // Safety check for array existence
      if (newSchedule.days && newSchedule.days[dayIndex] && newSchedule.days[dayIndex].blocks && newSchedule.days[dayIndex].blocks[blockIndex]) {
          // @ts-ignore - Dynamic assignment
          newSchedule.days[dayIndex].blocks[blockIndex][field] = value;
          setSchedule(newSchedule);
      }
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    
    // Client-side Resize before upload
    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1024;
                
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
            };
            img.onerror = reject;
        });
    };

    setLoading(true);
    setError(null);
    setSchedule(null); // Clear old while loading
    
    try {
        const resizedBase64Full = await resizeImage(file);
        const base64String = resizedBase64Full.split(',')[1];
        
        const userContext = getUserContext();
        
        // Timeout Logic: Reject after 90 seconds
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Request timed out. Please try again.")), 90000)
        );

        const result = await Promise.race([
            generateScheduleFromImage(base64String, userContext),
            timeoutPromise
        ]);

        setSchedule(result);
        setOriginalSchedule(JSON.parse(JSON.stringify(result)));
        
        // Save immediately
        savePlanToFirestore(result);

    } catch (e: any) {
        console.error("Plan Generation Error:", e);
        let errorMessage = "Sorry, we couldn't analyze the image. Please make sure it's clear and try again.";
        
        if (e.message && e.message.includes("timed out")) {
            errorMessage = "The analysis took longer than expected. Please try a smaller image or check your connection.";
        } else if (e.message && e.message.includes("No schedule generated")) {
            errorMessage = "We couldn't detect a schedule in that image. Please try a clearer screenshot.";
        }
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  // --- Drag & Drop Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  // --- Render Helpers ---

  // Refined Color System based on Screenshot
  const getBlockStyles = (type: string) => {
    switch(type) {
        case 'fixed': 
            return {
                container: 'bg-gray-50/90 border-gray-200',
                text: 'text-gray-800',
                subtext: 'text-gray-500',
                accent: 'text-gray-400',
                iconColor: 'text-gray-400',
                inputBg: 'bg-white/80'
            };
        case 'study': 
            return {
                container: 'bg-[#E0F7FA]/90 border-[#B2EBF2]', // Cyan-50 equivalent
                text: 'text-[#006064]', // Cyan-900
                subtext: 'text-[#006064]/70',
                accent: 'text-[#00838F]', // Cyan-800
                iconColor: 'text-[#00838F]',
                inputBg: 'bg-white/60'
            };
        case 'wellness': 
            return {
                container: 'bg-[#FCE4EC]/95 border-[#F8BBD0]', // Pink-50
                text: 'text-[#880E4F]', // Pink-900
                subtext: 'text-[#880E4F]/70',
                accent: 'text-[#C2185B]', // Pink-700
                iconColor: 'text-[#D81B60]',
                inputBg: 'bg-white/60'
            };
        case 'hobby': 
            return {
                container: 'bg-[#F3E5F5]/90 border-[#E1BEE7]', // Purple-50
                text: 'text-[#4A148C]', // Purple-900
                subtext: 'text-[#4A148C]/70',
                accent: 'text-[#7B1FA2]', // Purple-700
                iconColor: 'text-[#8E24AA]',
                inputBg: 'bg-white/60'
            };
        case 'meal': 
            return {
                container: 'bg-[#FFF3E0]/95 border-[#FFE0B2]', // Orange-50
                text: 'text-[#E65100]', // Orange-900
                subtext: 'text-[#E65100]/70',
                accent: 'text-[#EF6C00]', // Orange-700
                iconColor: 'text-[#F57C00]',
                inputBg: 'bg-white/60'
            };
        default: 
            return {
                container: 'bg-white border-gray-200',
                text: 'text-gray-800',
                subtext: 'text-gray-500',
                accent: 'text-gray-600',
                iconColor: 'text-gray-400',
                inputBg: 'bg-gray-50'
            };
    }
  };

  const renderBlockTypeIcon = (type: string, className: string) => {
      switch(type) {
          case 'fixed': return <Calendar size={14} className={className} />;
          case 'study': return <BookOpen size={14} className={className} />;
          case 'wellness': return <Heart size={14} className={className} />;
          case 'hobby': return <Gamepad2 size={14} className={className} />;
          case 'meal': return <Coffee size={14} className={className} />;
          default: return <Clock size={14} className={className} />;
      }
  };

  // Helper to find index of active day for updates
  const activeDayIndex = schedule?.days?.findIndex(d => d.day === activeDay) ?? -1;

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full h-[calc(100vh-140px)] md:h-full">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
           <h2 className={TYPOGRAPHY.h2}>{t('plan.title')}</h2>
           <p className={TYPOGRAPHY.body}>{t('plan.subtitle')}</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
            {schedule && !loading && (
                <>
                    {/* Toggle Edit/Save Mode */}
                    <button 
                        onClick={() => isEditing ? handleSaveEdits() : setIsEditing(true)}
                        className={`px-5 py-2.5 flex items-center gap-2 text-sm font-bold rounded-2xl transition-all shadow-sm
                            ${isEditing 
                                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-md transform scale-105' 
                                : 'bg-white text-[var(--text-main)] border border-transparent hover:border-[var(--card-border)] hover:bg-gray-50'
                            }`}
                    >
                        {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                        {isEditing ? t('plan.save') : t('plan.edit')}
                    </button>

                    <button 
                        onClick={() => { setSchedule(null); setIsEditing(false); }}
                        className={`bg-white hover:bg-gray-50 text-[var(--text-main)] px-5 py-2.5 flex items-center gap-2 text-sm font-bold rounded-2xl transition-all shadow-sm`}
                    >
                        <RefreshCw size={16} /> {t('plan.uploadNew')}
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`${STYLES.glassCard} flex-1 overflow-hidden flex flex-col relative w-full`}>
        
        {/* Loading Overlay */}
        <AnimatePresence>
        {loading && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
            >
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-[var(--primary)] rounded-full opacity-20 animate-ping duration-[2000ms]"></div>
                    <div className="absolute inset-0 bg-[var(--primary)] rounded-full opacity-10 animate-ping duration-[2000ms] delay-500"></div>
                    <div className="relative z-10">
                        <Mascot mood="happy" className="w-32 h-32 md:w-40 md:h-40" />
                        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-bounce shadow-lg">
                           <Sparkles size={20} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="h-8 mb-4 overflow-hidden relative w-full max-w-md">
                     <AnimatePresence mode='wait'>
                        <motion.h3 
                           key={loadingStep}
                           initial={{ y: 20, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           exit={{ y: -20, opacity: 0 }}
                           className="text-lg md:text-xl font-bold text-[var(--text-main)] absolute w-full text-center"
                        >
                           {t(`plan.loading.${loadingStep}`)}
                        </motion.h3>
                     </AnimatePresence>
                </div>
                <div className="w-64 max-w-full h-2 bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--card-border)] relative">
                    <motion.div 
                        className="absolute h-full bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent w-1/2"
                        animate={{ left: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-6 max-w-xs mx-auto leading-relaxed">
                    Talwit is analyzing your timetable to insert personalized study blocks and wellness breaks.
                </p>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Error Message */}
        {error && !loading && !schedule && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto my-4 max-w-md bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-start gap-3 text-left"
            >
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">{t('plan.error')}</h4>
                    <p className="text-red-600 dark:text-red-300 text-xs mt-1 leading-relaxed">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                    <X size={16} />
                </button>
            </motion.div>
        )}

        {/* Drop Zone (Empty State) */}
        {!schedule && !loading && (
             <div 
                className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all duration-300 m-4 overflow-y-auto ${
                    dragActive ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[0.99]' : 'border-gray-300 dark:border-gray-700 hover:border-[var(--primary)]/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
             >
                 <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="bg-[var(--input-bg)] p-6 rounded-full mb-6 shadow-sm flex-shrink-0"
                 >
                    <Upload size={40} className="text-[var(--text-muted)]" />
                 </motion.div>
                 <h3 className={TYPOGRAPHY.h3 + " text-center"}>{t('plan.dropTitle')}</h3>
                 <p className="text-[var(--text-secondary)] mt-2 mb-6 text-center max-w-xs">
                     {t('plan.dropDesc')}
                 </p>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={STYLES.primaryButton + " px-8 py-3 shadow-lg hover:shadow-xl hover:shadow-[var(--primary)]/20 flex-shrink-0"}
                 >
                     {t('plan.selectFile')}
                 </button>
                 <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleChangeFile}
                />
             </div>
        )}

        {/* Schedule View - REFACTORED FOR BEAUTIFUL MOBILE EXPERIENCE */}
        {schedule && (
            <div className="flex flex-col h-full w-full relative">
                
                {/* Day Tabs - Fixed top */}
                <div className="p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md overflow-x-auto scrollbar-hide flex-shrink-0 z-10 touch-pan-x">
                    <div className="flex gap-2 min-w-max">
                        {schedule.days?.map((d) => (
                            <button
                                key={d.day}
                                onClick={() => setActiveDay(d.day)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                                    activeDay === d.day 
                                    ? 'bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md transform scale-105' 
                                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg)]'
                                }`}
                            >
                                {t(`day.${d.day}`) || d.day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Scrollable Area (Vertical) */}
                <div className="flex-1 overflow-y-auto min-h-0 w-full bg-[var(--card-bg)]/30">
                    
                    {/* Inner Container - Fluid Layout */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeDay}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4 p-4 md:p-6 pb-24 md:pb-8 max-w-3xl mx-auto"
                        >
                            {schedule.days?.find(d => d.day === activeDay)?.blocks?.map((block, idx) => {
                                const styles = getBlockStyles(block.type);
                                return (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative flex gap-4 p-5 rounded-[2rem] border shadow-sm transition-all duration-300 ${styles.container}`}
                                >
                                    {/* Time Column - Stylized */}
                                    <div className="flex flex-col items-start pt-1 min-w-[70px] max-w-[80px] flex-shrink-0">
                                        {isEditing ? (
                                            <>
                                                <input 
                                                value={block.startTime} 
                                                onChange={(e) => updateBlock(activeDayIndex, idx, 'startTime', e.target.value)}
                                                className={`w-full ${styles.inputBg} backdrop-blur-sm border border-black/5 rounded-lg px-2 py-1.5 text-xs font-bold mb-2 shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none ${styles.accent}`}
                                                placeholder="00:00"
                                                />
                                                <input 
                                                value={block.endTime} 
                                                onChange={(e) => updateBlock(activeDayIndex, idx, 'endTime', e.target.value)}
                                                className={`w-full ${styles.inputBg} backdrop-blur-sm border border-black/5 rounded-lg px-2 py-1.5 text-xs font-medium opacity-80 shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none ${styles.accent}`}
                                                placeholder="00:00"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <span className={`text-base font-bold tracking-tight ${styles.accent}`}>{block.startTime}</span>
                                                <span className={`text-xs font-medium opacity-60 mt-1 ${styles.accent}`}>{block.endTime}</span>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {renderBlockTypeIcon(block.type, styles.iconColor)}
                                            {isEditing ? (
                                                <div className="relative">
                                                    <select
                                                        value={block.type}
                                                        onChange={(e) => updateBlock(activeDayIndex, idx, 'type', e.target.value)}
                                                        className={`appearance-none ${styles.inputBg} backdrop-blur-sm border border-black/5 rounded-lg px-3 py-1 pr-6 text-[10px] font-bold uppercase tracking-wider min-w-[100px] shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none cursor-pointer ${styles.text}`}
                                                    >
                                                        <option value="fixed">Fixed</option>
                                                        <option value="study">Study</option>
                                                        <option value="wellness">Wellness</option>
                                                        <option value="hobby">Hobby</option>
                                                        <option value="meal">Meal</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <span className={`text-[10px] uppercase font-bold tracking-wider opacity-90 ${styles.iconColor}`}>
                                                    {block.type}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {isEditing ? (
                                            <input 
                                                value={block.activity}
                                                onChange={(e) => updateBlock(activeDayIndex, idx, 'activity', e.target.value)}
                                                className={`w-full font-bold text-lg leading-tight mb-2 ${styles.inputBg} backdrop-blur-sm border border-black/5 rounded-xl px-3 py-2 shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none ${styles.text}`}
                                                placeholder="Activity Name"
                                            />
                                        ) : (
                                            <h4 className={`font-bold text-lg leading-tight mb-1 truncate ${styles.text}`}>
                                                {block.activity}
                                            </h4>
                                        )}

                                        {isEditing ? (
                                            <textarea
                                                value={block.description || ''}
                                                onChange={(e) => updateBlock(activeDayIndex, idx, 'description', e.target.value)}
                                                rows={2}
                                                className={`w-full text-sm opacity-90 ${styles.inputBg} backdrop-blur-sm border border-black/5 rounded-xl px-3 py-2 mt-1 shadow-sm focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none ${styles.subtext}`}
                                                placeholder="Add a description..."
                                            />
                                        ) : (
                                            block.description && (
                                                <p className={`text-sm font-medium leading-relaxed opacity-90 break-words line-clamp-2 ${styles.subtext}`}>
                                                    {block.description}
                                                </p>
                                            )
                                        )}
                                    </div>
                                </motion.div>
                            )}) || (
                                <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                                    <Clock size={48} className="mb-4 opacity-20" />
                                    <p>No activities scheduled for this day.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlanGenerator;

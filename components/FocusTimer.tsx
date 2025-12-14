
import React, { useState, useEffect, useRef } from 'react';
import { STYLES, Mascot, TYPOGRAPHY } from '../constants';
import { Play, Pause, RotateCcw, Wind, Brain } from 'lucide-react';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useSettings } from '../contexts/SettingsContext';

const FocusTimer: React.FC = () => {
  const { t } = useSettings();
  const { addStudyMinutes, logAction } = useAnalytics();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  
  // Track accumulated seconds to report minutes accurately
  const secondsAccumulator = useRef(0);

  // Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        
        // Logic for Analytics: Only count 'focus' time
        if (mode === 'focus') {
            secondsAccumulator.current += 1;
            // Every 60 seconds, log 1 minute to analytics
            if (secondsAccumulator.current >= 60) {
                addStudyMinutes(1);
                secondsAccumulator.current = 0;
            }
        }
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      
      // Log completion to AI
      if (mode === 'focus') {
          logAction("Completed a 25-minute focus session.");
      } else {
          logAction("Completed a break session.");
      }

      // Bell sound when timer ends
      const bell = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/bell.mp3');
      bell.volume = 0.5;
      bell.play().catch(e => console.log('Bell play failed', e));
      
      if (mode === 'focus') setMode('break');
      else setMode('focus');
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, addStudyMinutes, logAction]);

  const toggleTimer = () => {
      setIsActive(!isActive);
      if (!isActive) {
          logAction(`Started ${mode} timer.`);
      } else {
          logAction(`Paused ${mode} timer.`);
      }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    secondsAccumulator.current = 0; // Reset accumulator
    logAction("Reset timer.");
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    secondsAccumulator.current = 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const [breathStateKey, setBreathStateKey] = useState('focus.inhale');
  useEffect(() => {
      if (mode === 'break' && isActive) {
          const breathInterval = setInterval(() => {
            setBreathStateKey(prev => prev === 'focus.inhale' ? 'focus.exhale' : 'focus.inhale');
          }, 4000);
          return () => clearInterval(breathInterval);
      }
  }, [mode, isActive]);

  return (
    <div className={`${STYLES.glassCard} p-4 md:p-6 h-full flex flex-col items-center justify-around relative overflow-hidden`}>
      <div className="w-full flex justify-between items-center z-10 absolute top-6 px-6 left-0">
        <h3 className={`${TYPOGRAPHY.h3} flex items-center gap-2`}>
           {mode === 'focus' ? <Brain className="text-[var(--primary)] w-5 h-5" /> : <Wind className="text-teal-400 w-5 h-5" />}
           {mode === 'focus' ? t('focus.titleFocus') : t('focus.titleBreak')}
        </h3>
        <div className="flex gap-1 md:gap-2 bg-[var(--input-bg)] p-1 rounded-xl">
             <button 
                onClick={() => switchMode('focus')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${mode === 'focus' ? 'bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--card-bg)]'}`}
             >
                {t('focus.btnFocus')}
             </button>
             <button 
                onClick={() => switchMode('break')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${mode === 'break' ? 'bg-teal-400 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--card-bg)]'}`}
             >
                {t('focus.btnBreak')}
             </button>
        </div>
      </div>

      <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex items-center justify-center mt-12 z-10 transition-all duration-500">
         <div className={`absolute inset-0 rounded-full border-4 ${
             mode === 'break' && isActive 
                ? 'border-teal-300 animate-ping opacity-20' 
                : 'border-transparent'
         }`}></div>
         
         <div className={`w-full h-full rounded-full border-8 flex items-center justify-center bg-[var(--card-bg)] backdrop-blur-sm shadow-inner transition-colors duration-500 ${
             mode === 'focus' ? 'border-[var(--primary)]/30' : 'border-teal-300/30'
         }`}>
             <div className="text-center">
                 {mode === 'break' && isActive ? (
                     <div className="flex flex-col items-center animate-pulse">
                        <span className="text-xl md:text-2xl font-light text-teal-600">{t(breathStateKey)}</span>
                        <Mascot mood="calm" className="w-16 h-16 md:w-20 md:h-20 mt-2" />
                     </div>
                 ) : (
                    <>
                        <div className="text-5xl md:text-6xl font-bold text-[var(--text-main)] font-mono tracking-wider">
                            {formatTime(timeLeft)}
                        </div>
                        <p className="text-[var(--text-muted)] text-xs md:text-sm mt-2">
                            {isActive ? t('focus.tracking') : t('focus.ready')}
                        </p>
                    </>
                 )}
             </div>
         </div>
      </div>

      <div className="w-full space-y-4 md:space-y-6 z-10 flex flex-col items-center">
        <div className="flex justify-center gap-6">
            <button 
                onClick={toggleTimer}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] flex items-center justify-center shadow-lg transform hover:scale-105 transition-all"
            >
                {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1 rtl:mr-1" />}
            </button>
            <button 
                onClick={resetTimer}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--input-bg)] hover:bg-[var(--card-bg)] text-[var(--text-secondary)] flex items-center justify-center shadow-sm"
            >
                <RotateCcw size={18} className="rtl:-scale-x-100" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;

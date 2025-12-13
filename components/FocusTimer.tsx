import React, { useState, useEffect, useRef } from 'react';
import { STYLES, COLORS, Mascot } from '../constants';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Wind, Coffee, Brain } from 'lucide-react';
import { AmbientSound } from '../types';

const FocusTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [sound, setSound] = useState<AmbientSound>('none');
  
  // Audio Refs (Using free open source sounds)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sounds = {
    none: null,
    rain: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_03e05a7698.mp3?filename=soft-rain-ambient-111154.mp3', // Gentle Rain
    cafe: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_2e259e31d8.mp3?filename=people-talking-in-a-small-cafe-6394.mp3', // Cafe Ambience
    forest: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_361a99a818.mp3?filename=forest-wind-and-birds-6881.mp3' // Birds/Wind
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Simple notification sound
      const bell = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=service-bell-ring-14610.mp3');
      bell.volume = 0.5;
      bell.play().catch(e => console.log(e));
      
      // Auto switch mode suggestion
      if (mode === 'focus') setMode('break');
      else setMode('focus');
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        if (sound !== 'none' && isActive) {
            audioRef.current.src = sounds[sound]!;
            audioRef.current.loop = true;
            audioRef.current.play().catch(e => console.log("Audio play failed interaction required", e));
        }
    }
  }, [sound, isActive]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Breath Animation Logic
  const [breathState, setBreathState] = useState('Inhale');
  useEffect(() => {
      if (mode === 'break' && isActive) {
          const breathInterval = setInterval(() => {
            setBreathState(prev => prev === 'Inhale' ? 'Exhale' : 'Inhale');
          }, 4000); // 4 second cadence
          return () => clearInterval(breathInterval);
      }
  }, [mode, isActive]);

  return (
    <div className={`${STYLES.glassCard} p-4 md:p-6 h-full flex flex-col items-center justify-between relative overflow-hidden`}>
      {/* Background Audio Player */}
      <audio ref={audioRef} />

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
           {mode === 'focus' ? <Brain className="text-[#66DCDC] w-5 h-5" /> : <Wind className="text-teal-400 w-5 h-5" />}
           {mode === 'focus' ? 'Deep Focus' : 'Decompress'}
        </h3>
        <div className="flex gap-1 md:gap-2 bg-white/40 p-1 rounded-xl">
             <button 
                onClick={() => switchMode('focus')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${mode === 'focus' ? 'bg-[#66DCDC] text-white shadow-md' : 'text-gray-500 hover:bg-white'}`}
             >
                Focus
             </button>
             <button 
                onClick={() => switchMode('break')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${mode === 'break' ? 'bg-teal-400 text-white shadow-md' : 'text-gray-500 hover:bg-white'}`}
             >
                Break
             </button>
        </div>
      </div>

      {/* Main Circle Visual */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex items-center justify-center my-4 md:my-6 z-10 transition-all duration-500">
         {/* Pulsing ring for break mode */}
         <div className={`absolute inset-0 rounded-full border-4 ${
             mode === 'break' && isActive 
                ? 'border-teal-300 animate-ping opacity-20' 
                : 'border-transparent'
         }`}></div>
         
         {/* Static ring */}
         <div className={`w-full h-full rounded-full border-8 flex items-center justify-center bg-white/30 backdrop-blur-sm shadow-inner transition-colors duration-500 ${
             mode === 'focus' ? 'border-[#66DCDC]/30' : 'border-teal-300/30'
         }`}>
             <div className="text-center">
                 {mode === 'break' && isActive ? (
                     <div className="flex flex-col items-center animate-pulse">
                        <span className="text-xl md:text-2xl font-light text-teal-600">{breathState}</span>
                        <Mascot mood="calm" className="w-16 h-16 md:w-20 md:h-20 mt-2" />
                     </div>
                 ) : (
                    <>
                        <div className="text-5xl md:text-6xl font-bold text-gray-700 font-mono tracking-wider">
                            {formatTime(timeLeft)}
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm mt-2">{isActive ? 'Stay with the flow' : 'Ready to start?'}</p>
                    </>
                 )}
             </div>
         </div>
      </div>

      {/* Controls */}
      <div className="w-full space-y-4 md:space-y-6 z-10">
        
        {/* Play/Pause */}
        <div className="flex justify-center gap-6">
            <button 
                onClick={toggleTimer}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#66DCDC] hover:bg-[#45b7b7] text-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-all"
            >
                {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
            </button>
            <button 
                onClick={resetTimer}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/60 hover:bg-white text-gray-600 flex items-center justify-center shadow-sm"
            >
                <RotateCcw size={18} />
            </button>
        </div>

        {/* Soundscapes */}
        <div className="bg-white/40 p-2 md:p-3 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Ambient Sound</span>
                {sound !== 'none' && <Volume2 size={14} className="text-[#66DCDC]" />}
            </div>
            <div className="flex justify-between gap-1 md:gap-2">
                {(['none', 'rain', 'cafe', 'forest'] as AmbientSound[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => setSound(s)}
                        className={`flex-1 py-2 text-[10px] md:text-xs rounded-xl capitalize transition-all ${
                            sound === s 
                            ? 'bg-white shadow-sm text-[#66DCDC] font-medium ring-1 ring-[#66DCDC]' 
                            : 'text-gray-500 hover:bg-white/50'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;

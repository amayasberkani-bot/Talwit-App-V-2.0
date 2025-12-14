
import React, { useState } from 'react';
import { Mood } from '../types';
import { STYLES, Mascot, ANIMATIONS, TYPOGRAPHY } from '../constants';
import { Smile, Frown, Meh, CloudRain, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';

interface MoodTrackerProps {
  onLogMood: (mood: Mood, note: string) => void;
  currentMood: Mood | null;
}

const MoodTracker: React.FC<MoodTrackerProps> = ({ onLogMood, currentMood }) => {
  const { t } = useSettings();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(currentMood);
  const [note, setNote] = useState('');

  const moods: { type: Mood; label: string; icon: React.ReactNode }[] = [
    { type: 'happy', label: t('mood.happy'), icon: <Sun className="w-6 h-6 text-yellow-500" /> },
    { type: 'calm', label: t('mood.calm'), icon: <Smile className="w-6 h-6 text-teal-500" /> },
    { type: 'tired', label: t('mood.tired'), icon: <Meh className="w-6 h-6 text-gray-400" /> },
    { type: 'anxious', label: t('mood.anxious'), icon: <CloudRain className="w-6 h-6 text-blue-400" /> },
    { type: 'stressed', label: t('mood.stressed'), icon: <Frown className="w-6 h-6 text-red-400" /> },
  ];

  const handleLog = () => {
    if (selectedMood) {
      onLogMood(selectedMood, note);
      setNote('');
    }
  };

  return (
    <div className={`${STYLES.glassCard} p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={TYPOGRAPHY.h3}>{t('mood.title')}</h3>
        {selectedMood && <Mascot mood={selectedMood} className="w-12 h-12" />}
      </div>

      <div className="flex justify-between gap-2 mb-6 overflow-x-auto pb-2">
        {moods.map((m) => (
          <motion.button
            key={m.type}
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -5 }}
            onClick={() => setSelectedMood(m.type)}
            className={`flex flex-col items-center p-3 rounded-2xl min-w-[70px] transition-colors duration-200 ${
              selectedMood === m.type 
                ? 'bg-[var(--primary)]/20 ring-2 ring-[var(--primary)]' 
                : 'bg-[var(--input-bg)] hover:bg-[var(--card-bg)]'
            }`}
          >
            <div className="mb-2">{m.icon}</div>
            <span className={`text-xs font-medium ${selectedMood === m.type ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)]'}`}>{m.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedMood && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
            >
            <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('mood.placeholder')}
                className={`${STYLES.glassInput} w-full p-3 mb-3 text-sm`}
            />
            <motion.button 
                whileTap={ANIMATIONS.tap}
                onClick={handleLog}
                className={`${STYLES.primaryButton} w-full py-2 text-sm`}
            >
                {t('mood.checkIn')}
            </motion.button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodTracker;

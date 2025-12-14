
import React from 'react';
import { Habit } from '../types';
import { STYLES, TYPOGRAPHY } from '../constants';
import { Check, Flame } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
}

const HabitList: React.FC<HabitListProps> = ({ habits, onToggleHabit }) => {
  const { t } = useSettings();
  
  return (
    <div className={`${STYLES.glassCard} p-6 h-full overflow-y-auto`}>
      <h3 className={TYPOGRAPHY.h3 + " mb-4"}>{t('habits.title')}</h3>
      <div className="space-y-3">
        {habits.map(habit => (
          <div 
            key={habit.id}
            onClick={() => onToggleHabit(habit.id)}
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                habit.completedToday 
                ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm' 
                : 'bg-[var(--input-bg)] border-transparent hover:bg-[var(--card-bg)]'
            }`}
          >
            <div className="flex items-center gap-3">
                <div className="text-2xl">{habit.icon}</div>
                <div>
                    <h4 className={`font-medium text-sm ${habit.completedToday ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)]'}`}>{habit.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame size={12} fill={habit.streak > 0 ? "currentColor" : "none"} />
                        <span>{habit.streak} {t('habits.streak')}</span>
                    </div>
                </div>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                habit.completedToday 
                ? 'bg-[var(--primary)] border-[var(--primary)]' 
                : 'border-[var(--text-muted)] group-hover:border-[var(--primary)]'
            }`}>
                {habit.completedToday && <Check size={14} className="text-[var(--text-on-primary)]" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitList;

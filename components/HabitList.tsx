import React from 'react';
import { Habit } from '../types';
import { STYLES } from '../constants';
import { Check, Flame } from 'lucide-react';

interface HabitListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
}

const HabitList: React.FC<HabitListProps> = ({ habits, onToggleHabit }) => {
  return (
    <div className={`${STYLES.glassCard} p-6 h-full overflow-y-auto`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Wellness Habits</h3>
      <div className="space-y-3">
        {habits.map(habit => (
          <div 
            key={habit.id}
            onClick={() => onToggleHabit(habit.id)}
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                habit.completedToday 
                ? 'bg-[#66DCDC]/10 border-[#66DCDC] shadow-sm' 
                : 'bg-white/40 border-transparent hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-3">
                <div className="text-2xl">{habit.icon}</div>
                <div>
                    <h4 className={`font-medium text-sm ${habit.completedToday ? 'text-gray-800' : 'text-gray-600'}`}>{habit.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame size={12} fill={habit.streak > 0 ? "currentColor" : "none"} />
                        <span>{habit.streak} day streak</span>
                    </div>
                </div>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                habit.completedToday 
                ? 'bg-[#66DCDC] border-[#66DCDC]' 
                : 'border-gray-300 group-hover:border-[#66DCDC]'
            }`}>
                {habit.completedToday && <Check size={14} className="text-white" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitList;

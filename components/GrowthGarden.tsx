
import React from 'react';
import { Habit } from '../types';
import { STYLES, COLORS, TYPOGRAPHY } from '../constants';
import { Leaf, Droplets, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface GrowthGardenProps {
  habits: Habit[];
  compact?: boolean;
}

const GrowthGarden: React.FC<GrowthGardenProps> = ({ habits, compact = false }) => {
  const { t } = useSettings();
  const completedCount = habits.filter(h => h.completedToday).length;
  const totalStreak = habits.reduce((acc, curr) => acc + curr.streak, 0);
  
  const growthStage = Math.min(3, Math.floor(totalStreak / 3)); 
  const isThriving = completedCount === habits.length;

  return (
    <div className={`${!compact ? STYLES.glassCard : ''} ${!compact ? 'p-0' : ''} overflow-hidden relative ${!compact ? 'min-h-[300px]' : 'h-full w-full'} flex flex-col`}>
      {!compact && (
        <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start">
            <div>
            <h3 className={`${TYPOGRAPHY.h3} flex items-center gap-2`}>
                <Leaf className="w-5 h-5 text-green-500" /> {t('garden.title')}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
                {isThriving ? t('garden.thriving') : t('garden.needsWater')}
            </p>
            </div>
            <div className="bg-[var(--input-bg)] px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium text-blue-500 shadow-sm backdrop-blur-sm">
            <Droplets size={14} />
            <span>{completedCount}/{habits.length} {t('garden.drops')}</span>
            </div>
        </div>
      )}

      <div className={`flex-1 ${!compact ? 'bg-gradient-to-b from-blue-50/20 to-green-50/20' : ''} relative flex items-end justify-center ${!compact ? 'pb-8' : ''}`}>
        
        {!compact && <div className="absolute bottom-0 w-full h-12 bg-[#e8f5e9]/50 rounded-b-3xl"></div>}

        <div className="relative z-0 transition-all duration-1000 ease-in-out transform">
          <svg width={compact ? "120" : "200"} height={compact ? "140" : "240"} viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 220 L140 220 L150 160 L50 160 Z" fill="#E8D5B5" stroke="#D7CCC8" strokeWidth="2" />
            
            <path 
                d="M100 160 Q100 130 100 100" 
                stroke="#81C784" 
                strokeWidth="6" 
                fill="none" 
                strokeLinecap="round"
                className="origin-bottom transition-all duration-1000"
                style={{ transform: `scaleY(${growthStage >= 0 ? 1 : 0.2})` }}
            />

            {growthStage >= 1 && (
                <g className="animate-fade-in origin-center">
                    <path d="M100 130 Q130 110 140 130 Q120 150 100 130" fill="#66BB6A" />
                    <path d="M100 110 Q70 90 60 110 Q80 130 100 110" fill="#66BB6A" />
                </g>
            )}

            {growthStage >= 2 && (
                <g className="animate-fade-in">
                    <path d="M100 80 Q140 50 150 80 Q120 100 80" fill="#4CAF50" />
                    <path d="M100 70 Q50 40 40 70 Q80 100 70" fill="#4CAF50" />
                </g>
            )}

            {growthStage >= 3 && (
                <g className="animate-bounce-slow">
                    <circle cx="100" cy="40" r="15" fill="#FFD54F" />
                    <circle cx="100" cy="20" r="12" fill="white" opacity="0.8" />
                    <path d="M100 40 L80 20 M100 40 L120 20 M100 40 L80 60 M100 40 L120 60" stroke="#FFD54F" strokeWidth="2" />
                </g>
            )}
            
            {completedCount > 0 && (
                 <g>
                   <circle cx="80" cy="0" r="4" fill="#66DCDC" className="animate-drop" style={{animationDelay: '0s'}} />
                   <circle cx="120" cy="20" r="3" fill="#66DCDC" className="animate-drop" style={{animationDelay: '0.5s'}} />
                 </g>
            )}
          </svg>
        </div>
        
        {isThriving && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Sparkles className={`${compact ? 'w-20 h-20' : 'w-32 h-32'} text-yellow-300 animate-pulse opacity-50`} />
            </div>
        )}
      </div>
    </div>
  );
};

export default GrowthGarden;

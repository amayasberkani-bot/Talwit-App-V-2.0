import React from 'react';
import { Habit } from '../types';
import { STYLES, COLORS } from '../constants';
import { Leaf, Droplets, Sparkles } from 'lucide-react';

interface GrowthGardenProps {
  habits: Habit[];
}

const GrowthGarden: React.FC<GrowthGardenProps> = ({ habits }) => {
  // Calculate Growth Score based on streaks and completion
  const completedCount = habits.filter(h => h.completedToday).length;
  const totalStreak = habits.reduce((acc, curr) => acc + curr.streak, 0);
  
  // Simple logic to determine plant stage (0 to 3)
  const growthStage = Math.min(3, Math.floor(totalStreak / 3)); 
  const isThriving = completedCount === habits.length;

  return (
    <div className={`${STYLES.glassCard} p-0 overflow-hidden relative min-h-[300px] flex flex-col`}>
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-500" /> Mind Garden
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {isThriving ? "Your garden is thriving today!" : "Complete habits to water your mind."}
          </p>
        </div>
        <div className="bg-white/50 px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium text-blue-500">
           <Droplets size={14} />
           <span>{completedCount}/{habits.length} Drops</span>
        </div>
      </div>

      {/* Garden Visualization */}
      <div className="flex-1 bg-gradient-to-b from-blue-50/50 to-green-50/50 relative flex items-end justify-center pb-8">
        
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-12 bg-[#e8f5e9] rounded-b-3xl"></div>

        {/* The Plant */}
        <div className="relative z-0 transition-all duration-1000 ease-in-out transform">
          <svg width="200" height="240" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
            {/* Pot */}
            <path d="M60 220 L140 220 L150 160 L50 160 Z" fill="#E8D5B5" stroke="#D7CCC8" strokeWidth="2" />
            
            {/* Stem - Grows with stage */}
            <path 
                d="M100 160 Q100 130 100 100" 
                stroke="#81C784" 
                strokeWidth="6" 
                fill="none" 
                strokeLinecap="round"
                className="origin-bottom transition-all duration-1000"
                style={{ transform: `scaleY(${growthStage >= 0 ? 1 : 0.2})` }}
            />

            {/* Stage 1 Leaves */}
            {growthStage >= 1 && (
                <g className="animate-fade-in origin-center">
                    <path d="M100 130 Q130 110 140 130 Q120 150 100 130" fill="#66BB6A" />
                    <path d="M100 110 Q70 90 60 110 Q80 130 100 110" fill="#66BB6A" />
                </g>
            )}

            {/* Stage 2 Leaves */}
            {growthStage >= 2 && (
                <g className="animate-fade-in">
                    <path d="M100 80 Q140 50 150 80 Q120 100 100 80" fill="#4CAF50" />
                    <path d="M100 70 Q50 40 40 70 Q80 100 100 70" fill="#4CAF50" />
                </g>
            )}

            {/* Stage 3 Flower */}
            {growthStage >= 3 && (
                <g className="animate-bounce-slow">
                    <circle cx="100" cy="40" r="15" fill="#FFD54F" />
                    <circle cx="100" cy="20" r="12" fill="white" opacity="0.8" />
                    <path d="M100 40 L80 20 M100 40 L120 20 M100 40 L80 60 M100 40 L120 60" stroke="#FFD54F" strokeWidth="2" />
                </g>
            )}
            
            {/* Water Animation when habits completed today */}
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
                <Sparkles className="w-32 h-32 text-yellow-300 animate-pulse opacity-50" />
            </div>
        )}
      </div>
    </div>
  );
};

export default GrowthGarden;

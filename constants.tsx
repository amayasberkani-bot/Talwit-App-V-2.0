import React from 'react';
import { motion, Variants } from 'framer-motion';

// Color Palette
export const COLORS = {
  primary: '#66DCDC',
  primaryDark: '#45b7b7',
  glassWhite: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
  textDark: '#1f2937',
  textLight: '#6b7280',
};

// Reusable Styles
export const STYLES = {
  glassCard: `backdrop-blur-xl bg-white/60 border border-white/50 shadow-lg rounded-3xl`,
  glassInput: `backdrop-blur-md bg-white/40 border border-white/60 focus:ring-2 focus:ring-[#66DCDC] focus:border-transparent rounded-2xl outline-none transition-all duration-300`,
  primaryButton: `bg-[#66DCDC] hover:bg-[#45b7b7] text-white font-semibold rounded-2xl shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-95`,
};

// --- ANIMATION SYSTEM ---

// 1. Easing Curves
// "Soft" is for entering elements. "Crisp" is for exits or micro-interactions.
const EASING = {
  soft: [0.25, 0.1, 0.25, 1], // Cubic bezier for natural slowdown
  spring: { type: "spring", stiffness: 100, damping: 20, mass: 1 }, // No bounce, just fluid
  bouncy: { type: "spring", stiffness: 300, damping: 15 }, // For selection feedback
};

// 2. Variants Registry
export const ANIMATIONS = {
  // Page Transitions (Slide Up + Fade)
  page: {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASING.soft } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
  } as Variants,

  // Card Stagger (Children animate one by one)
  containerStagger: {
    animate: { transition: { staggerChildren: 0.1 } }
  } as Variants,

  // Simple Fade In
  fadeIn: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASING.soft } }
  } as Variants,

  // Micro-interaction: Button Tap
  tap: {
    scale: 0.96,
    transition: { duration: 0.1 }
  },

  // Micro-interaction: Hover
  hover: {
    y: -4,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

// Mascot Component (Talwit Blob) - Wrapped in Motion
export const Mascot = ({ mood = 'happy', className = "w-24 h-24" }: { mood?: string, className?: string }) => {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ 
        repeat: Infinity, 
        duration: 4, 
        ease: "easeInOut" 
      }}
    >
      <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#66DCDC', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#A5F3FC', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Body - Animated slightly */}
        <path fill="url(#blobGradient)" d="M45.7,-76.3C58.9,-69.3,69.1,-58.3,77.3,-46.3C85.5,-34.3,91.7,-21.3,90.4,-8.9C89.1,3.5,80.3,15.3,71.5,26.4C62.7,37.5,53.9,47.9,43.6,56.8C33.3,65.7,21.5,73.1,8.9,74.9C-3.7,76.7,-17.1,72.9,-29.3,66.3C-41.5,59.7,-52.5,50.3,-61.8,39.1C-71.1,27.9,-78.7,14.9,-79.3,1.4C-79.9,-12.1,-73.5,-26.1,-63.9,-37.2C-54.3,-48.3,-41.5,-56.5,-29.2,-64.1C-16.9,-71.7,-5.1,-78.7,8.2,-80.1C21.5,-81.5,32.5,-77.3,45.7,-76.3Z" transform="translate(100 100)">
          <animate attributeName="d" 
            dur="5s" 
            repeatCount="indefinite"
            values="M45.7,-76.3C58.9,-69.3,69.1,-58.3,77.3,-46.3C85.5,-34.3,91.7,-21.3,90.4,-8.9C89.1,3.5,80.3,15.3,71.5,26.4C62.7,37.5,53.9,47.9,43.6,56.8C33.3,65.7,21.5,73.1,8.9,74.9C-3.7,76.7,-17.1,72.9,-29.3,66.3C-41.5,59.7,-52.5,50.3,-61.8,39.1C-71.1,27.9,-78.7,14.9,-79.3,1.4C-79.9,-12.1,-73.5,-26.1,-63.9,-37.2C-54.3,-48.3,-41.5,-56.5,-29.2,-64.1C-16.9,-71.7,-5.1,-78.7,8.2,-80.1C21.5,-81.5,32.5,-77.3,45.7,-76.3Z;
                    M41.4,-72.1C53.6,-66.1,63.4,-56.1,71.5,-44.7C79.6,-33.3,86,-20.5,84.9,-8.2C83.8,4.1,75.2,15.9,66.4,26.8C57.6,37.7,48.6,47.7,38.2,55.9C27.8,64.1,16,70.5,3.6,71.9C-8.8,73.3,-21.8,69.7,-33.6,63.1C-45.4,56.5,-56,46.9,-64.5,35.8C-73,24.7,-79.4,12.1,-79.1,-0.6C-78.8,-13.3,-71.8,-26.1,-62.4,-36.8C-53,-47.5,-41.2,-56.1,-29.3,-63.6C-17.4,-71.1,-5.4,-77.5,7.5,-79.1C20.4,-80.7,30.2,-76.3,41.4,-72.1Z;
                    M45.7,-76.3C58.9,-69.3,69.1,-58.3,77.3,-46.3C85.5,-34.3,91.7,-21.3,90.4,-8.9C89.1,3.5,80.3,15.3,71.5,26.4C62.7,37.5,53.9,47.9,43.6,56.8C33.3,65.7,21.5,73.1,8.9,74.9C-3.7,76.7,-17.1,72.9,-29.3,66.3C-41.5,59.7,-52.5,50.3,-61.8,39.1C-71.1,27.9,-78.7,14.9,-79.3,1.4C-79.9,-12.1,-73.5,-26.1,-63.9,-37.2C-54.3,-48.3,-41.5,-56.5,-29.2,-64.1C-16.9,-71.7,-5.1,-78.7,8.2,-80.1C21.5,-81.5,32.5,-77.3,45.7,-76.3Z" 
          />
        </path>

        {/* Face Expression */}
        <g transform="translate(100 100)">
          {mood === 'happy' && (
            <>
              <circle cx="-20" cy="-10" r="5" fill="white" />
              <circle cx="20" cy="-10" r="5" fill="white" />
              <path d="M-15 15 Q0 25 15 15" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          )}
          {mood === 'calm' && (
            <>
               <path d="M-25 -10 Q-20 -15 -15 -10" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
               <path d="M15 -10 Q20 -15 25 -10" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
               <path d="M-5 15 Q0 18 5 15" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
           {mood === 'anxious' && (
            <>
              <circle cx="-20" cy="-10" r="6" fill="white" />
              <circle cx="20" cy="-10" r="6" fill="white" />
              <path d="M-10 20 Q0 10 10 20" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
               <circle cx="35" cy="-35" r="3" fill="rgba(255,255,255,0.7)">
                  <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
               </circle>
            </>
          )}
        </g>
      </svg>
    </motion.div>
  );
};

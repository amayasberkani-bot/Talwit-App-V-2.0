import React from 'react';
import { motion, Variants } from 'framer-motion';

// Color Palette (kept for JS references if needed, but UI primarily uses CSS vars now)
export const COLORS = {
  primary: '#66DCDC',
  primaryDark: '#45b7b7',
};

// --- TYPOGRAPHY SYSTEM ---
export const TYPOGRAPHY = {
  h1: "text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-main)]",
  h2: "text-xl md:text-2xl font-bold tracking-tight text-[var(--text-main)]",
  h3: "text-lg md:text-xl font-semibold text-[var(--text-main)]",
  body: "text-base text-[var(--text-secondary)] leading-relaxed",
  small: "text-sm text-[var(--text-secondary)]",
  caption: "text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold",
  label: "text-sm font-medium text-[var(--text-secondary)] mb-1 block"
};

// --- REUSABLE STYLES ---
export const STYLES = {
  // Enhanced glass card with better border visibility and background opacity from CSS vars
  glassCard: `backdrop-blur-xl border shadow-lg rounded-3xl transition-colors duration-300 bg-[var(--card-bg)] border-[var(--card-border)]`,
  
  // Inputs with clearer text colors
  glassInput: `backdrop-blur-md border text-[var(--text-main)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent rounded-2xl outline-none transition-all duration-300 bg-[var(--input-bg)] border-[var(--card-border)]`,
  
  // Buttons with solid text contrast
  primaryButton: `bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-on-primary)] font-bold rounded-2xl shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center`,
  
  // Secondary button (Ghost/Outline)
  secondaryButton: `bg-[var(--input-bg)] hover:bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--card-border)] font-medium rounded-2xl transition-all duration-200`,
  
  // Active/Selected state for options
  activeOption: `bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-transparent`,
  inactiveOption: `bg-[var(--input-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg)] border border-transparent`
};

// --- ANIMATION SYSTEM ---
const EASING = {
  // Modern, high-end iOS style easing
  smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
  spring: { type: "spring", stiffness: 100, damping: 20, mass: 1 },
};

export const ANIMATIONS = {
  page: {
    initial: { opacity: 0, y: 10, filter: 'blur(8px)', scale: 0.99 },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { duration: 0.5, ease: EASING.smooth } },
    exit: { opacity: 0, scale: 0.99, filter: 'blur(4px)', transition: { duration: 0.3, ease: 'easeIn' } }
  } as Variants,

  containerStagger: {
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  } as Variants,

  fadeIn: {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASING.smooth } }
  } as Variants,

  tap: {
    scale: 0.96,
    transition: { duration: 0.1 }
  },

  hover: {
    y: -4,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

// Mascot Component
export const Mascot = ({ mood = 'happy', className = "w-24 h-24" }: { mood?: string, className?: string }) => {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      className="relative flex items-center justify-center"
    >
      <img 
        src="https://i.postimg.cc/9MZLX869/logo-AI-talwit-(1).png" 
        alt="Talwit AI Persona"
        className={`${className} object-contain drop-shadow-sm`}
      />
    </motion.div>
  );
};
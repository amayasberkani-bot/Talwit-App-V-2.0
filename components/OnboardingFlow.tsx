import React, { useState } from 'react';
import { OnboardingQuestion, UserContext } from '../types';
import { STYLES, Mascot, ANIMATIONS } from '../constants';
import { ChevronRight, SkipForward, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: (context: UserContext) => void;
}

const QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'name',
    question: "Hi! I'm Talwit. First things first, what should I call you?",
    type: 'text',
    placeholder: 'Enter your name...',
    description: "I'll use this to address you in our chats."
  },
  {
    id: 'studyField',
    question: "What are you currently studying?",
    type: 'text',
    placeholder: 'e.g., Computer Science, Biology, History...',
    description: "Helps me understand your academic context."
  },
  {
    id: 'mainGoal',
    question: "What is your main goal right now?",
    type: 'choice',
    options: [
      "Improve my grades 📈",
      "Just survive the semester 😅",
      "Find better work-life balance ⚖️",
      "Build consistent habits 🌱"
    ]
  },
  {
    id: 'productiveTime',
    question: "When do you feel most energetic to study?",
    type: 'choice',
    options: [
      "Early Morning (The Early Bird)",
      "Mid-Day (The Power Lunch)",
      "Evening (The Night Owl)",
      "It varies completely"
    ]
  },
  {
    id: 'currentLoad',
    question: "How would you describe your current workload?",
    type: 'choice',
    options: [
      "Light / Manageable",
      "Moderate / Steady",
      "Heavy / Challenging",
      "Overwhelming / Critical"
    ]
  },
  {
    id: 'wellnessStatus',
    question: "How has your sleep and energy been lately?",
    type: 'choice',
    options: [
      "Great! Fully charged 🔋",
      "Okay, but could be better 😐",
      "Tired and draining fast 🪫",
      "Exhausted / Struggling 💤"
    ]
  },
  {
    id: 'motivationStyle',
    question: "What kind of motivation works best for you?",
    type: 'choice',
    options: [
      "Gentle & Encouraging (Soft)",
      "Structured & Plan-focused (Logical)",
      "Direct & Accountability-based (Firm)",
      "Humorous & Light (Fun)"
    ]
  },
  {
    id: 'stressRelief',
    question: "When you feel overwhelmed, what usually helps?",
    type: 'text',
    placeholder: 'e.g. Taking a walk, listening to music, venting...',
    description: "I can remind you of this when things get tough."
  }
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserContext>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    const currentQ = QUESTIONS[step];
    
    // Save current answer
    const valueToSave = currentQ.type === 'text' ? currentInput : currentInput;
    
    // Validate
    if (currentQ.type === 'text' && !valueToSave.trim()) return;
    if (currentQ.type === 'choice' && !valueToSave) return;

    const newAnswers = { ...answers, [currentQ.id]: valueToSave };
    setAnswers(newAnswers);
    setCurrentInput('');
    setDirection(1);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Finish
      onComplete(newAnswers as UserContext);
    }
  };

  const handleSkip = () => {
    const currentQ = QUESTIONS[step];
    const newAnswers = { ...answers, [currentQ.id]: "Not specified" };
    setAnswers(newAnswers);
    setCurrentInput('');
    setDirection(1);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(newAnswers as UserContext);
    }
  };

  const handleSelectOption = (option: string) => {
    setCurrentInput(option);
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const currentQ = QUESTIONS[step];

  // Variants for Card Sliding
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#e0f7fa] to-[#f3e5f5]">
      <div className={`max-w-xl w-full ${STYLES.glassCard} p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[500px] md:min-h-[550px]`}>
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-200/50">
          <motion.div 
            className="h-full bg-[#66DCDC]"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut", duration: 0.5 }}
          />
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-6 mt-4">
            <Mascot mood="happy" className="w-16 h-16 md:w-20 md:h-20" />
        </div>

        {/* Question Content (AnimatePresence) */}
        <div className="flex-1 flex flex-col justify-center relative">
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="w-full"
                >
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 text-center leading-tight">
                        {currentQ.question}
                    </h2>
                    {currentQ.description && (
                        <p className="text-gray-500 text-center mb-6 md:mb-8 text-xs md:text-sm">{currentQ.description}</p>
                    )}

                    {/* Input Area */}
                    <div className="w-full max-w-md mx-auto space-y-3 md:space-y-4">
                        {currentQ.type === 'text' ? (
                        <input
                            type="text"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            placeholder={currentQ.placeholder}
                            className={`${STYLES.glassInput} w-full p-3 md:p-4 text-base md:text-lg text-center`}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        />
                        ) : (
                        <div className="grid grid-cols-1 gap-2 md:gap-3">
                            {currentQ.options?.map((option) => (
                            <motion.button
                                whileTap={ANIMATIONS.tap}
                                key={option}
                                onClick={() => handleSelectOption(option)}
                                className={`p-3 md:p-4 rounded-2xl text-left transition-all duration-200 flex justify-between items-center text-sm md:text-base ${
                                currentInput === option
                                    ? 'bg-[#66DCDC] text-white shadow-lg'
                                    : 'bg-white/40 hover:bg-white/70 text-gray-700'
                                }`}
                            >
                                <span>{option}</span>
                                {currentInput === option && <Check size={18} />}
                            </motion.button>
                            ))}
                        </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <button 
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            Skip <SkipForward size={14} />
          </button>

          <div className="text-xs text-gray-400 font-mono">
            {step + 1} / {QUESTIONS.length}
          </div>

          <motion.button 
            whileHover={!currentInput.trim() ? {} : { scale: 1.05 }}
            whileTap={!currentInput.trim() ? {} : { scale: 0.95 }}
            onClick={handleNext}
            disabled={!currentInput.trim()}
            className={`${STYLES.primaryButton} px-4 md:px-6 py-2 md:py-3 flex items-center gap-2 text-sm md:text-base ${!currentInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {step === QUESTIONS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={18} />
          </motion.button>
        </div>

      </div>
    </div>
  );
};

export default OnboardingFlow;

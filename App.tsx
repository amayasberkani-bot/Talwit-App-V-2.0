import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageCircleHeart, BrainCircuit, Timer } from 'lucide-react';
import { Mood, MoodEntry, Habit, UserContext } from './types';
import MoodTracker from './components/MoodTracker';
import ChatCompanion from './components/ChatCompanion';
import StudyPlanGenerator from './components/StudyPlanGenerator';
import HabitList from './components/HabitList';
import GrowthGarden from './components/GrowthGarden';
import FocusTimer from './components/FocusTimer';
import OnboardingFlow from './components/OnboardingFlow';
import { STYLES, Mascot, ANIMATIONS } from './constants';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

// --- Dashboard Component ---
const Dashboard: React.FC<{
  moods: MoodEntry[],
  habits: Habit[],
  userContext: UserContext | null,
  onLogMood: (m: Mood, n: string) => void,
  onToggleHabit: (id: string) => void
}> = ({ moods, habits, userContext, onLogMood, onToggleHabit }) => {
  
  const currentMood = moods.length > 0 ? moods[moods.length - 1].mood : null;

  // Mock data transformation for chart
  const data = moods.slice(-7).map((m, i) => ({
    name: `Day ${i+1}`,
    score: m.mood === 'happy' ? 5 : m.mood === 'calm' ? 4 : m.mood === 'tired' ? 2 : m.mood === 'anxious' ? 1 : 3
  }));

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto"
      variants={ANIMATIONS.containerStagger}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div className="col-span-1 md:col-span-2 lg:col-span-3" variants={ANIMATIONS.fadeIn}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
            Hello, {userContext?.name || 'Student'}
        </h1>
        <p className="text-sm md:text-base text-gray-600">Let's balance your {userContext?.studyField || 'studies'} with peace today.</p>
      </motion.div>

      {/* Left Column: Mood & Stats */}
      <motion.div className="col-span-1 md:col-span-1 lg:col-span-1 space-y-4 md:space-y-6" variants={ANIMATIONS.fadeIn}>
        <MoodTracker onLogMood={onLogMood} currentMood={currentMood} />
        
        {/* Simple Analytics Card */}
        <div className={`${STYLES.glassCard} p-6 h-64`}>
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Mood Flow</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#66DCDC" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#66DCDC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                />
                <Area type="monotone" dataKey="score" stroke="#66DCDC" fillOpacity={1} fill="url(#colorMood)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Middle Column: Habits & Garden */}
      <motion.div className="col-span-1 md:col-span-1 lg:col-span-1 flex flex-col gap-4 md:gap-6" variants={ANIMATIONS.fadeIn}>
        <div className="flex-1">
            <GrowthGarden habits={habits} />
        </div>
        <div className="flex-1">
            <HabitList habits={habits} onToggleHabit={onToggleHabit} />
        </div>
      </motion.div>

      {/* Right Column: Focus Timer & Motivation */}
      {/* On tablet, this spans full width (2 cols) to avoid looking squashed, or moves to next row */}
      <motion.div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col gap-4 md:gap-6" variants={ANIMATIONS.fadeIn}>
        <div className="h-[400px] md:h-[450px] lg:h-[400px]">
            <FocusTimer />
        </div>

        {/* Quick Task Overview (Mock) */}
        <div className={`${STYLES.glassCard} p-6 flex-1`}>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Today's Focus</h3>
            <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span> Finish History Essay
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0"></span> 10 min Meditation
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span> Review Math Notes
                </li>
            </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Animated Routes Wrapper ---
const AnimatedRoutes: React.FC<any> = ({ moods, habits, userContext, handleLogMood, handleToggleHabit, getCurrentMood }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageWrapper>
            <Dashboard 
              moods={moods} 
              habits={habits}
              userContext={userContext} 
              onLogMood={handleLogMood}
              onToggleHabit={handleToggleHabit} 
            />
          </PageWrapper>
        } />
        <Route path="/plan" element={
            <PageWrapper>
                <StudyPlanGenerator />
            </PageWrapper>
        } />
        <Route path="/focus" element={
            <PageWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <div className="h-[500px] md:h-auto">
                        <FocusTimer />
                    </div>
                    <div className="flex flex-col gap-6">
                         <GrowthGarden habits={habits} />
                         <div className={`${STYLES.glassCard} p-6 flex-1 flex flex-col justify-center items-center text-center`}>
                             <h3 className="text-xl font-bold text-gray-800 mb-2">Why Focus Mode?</h3>
                             <p className="text-sm text-gray-600">Short bursts of intense focus followed by deep relaxation helps prevent burnout. Listen to the ambient sounds to stay grounded.</p>
                         </div>
                    </div>
                </div>
            </PageWrapper>
        } />
        <Route path="/chat" element={
            <PageWrapper>
                <ChatCompanion currentMood={getCurrentMood()} userContext={userContext} />
            </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// Helper for consistent page transitions
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={ANIMATIONS.page}
    initial="initial"
    animate="animate"
    exit="exit"
    className="h-full"
  >
    {children}
  </motion.div>
);

// --- Main App & Navigation ---
const App: React.FC = () => {
  // State
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', title: 'Drink Water', streak: 5, completedToday: false, icon: '💧' },
    { id: '2', title: 'Read 10 pages', streak: 2, completedToday: false, icon: '📚' },
    { id: '3', title: 'Mindful Breathing', streak: 12, completedToday: true, icon: '🧘' },
  ]);
  
  // User Context / Onboarding State
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Check local storage on load
    const savedContext = localStorage.getItem('talwit_user_context');
    if (savedContext) {
      setUserContext(JSON.parse(savedContext));
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = (context: UserContext) => {
    setUserContext(context);
    localStorage.setItem('talwit_user_context', JSON.stringify(context));
    setShowOnboarding(false);
  };

  const handleLogMood = (mood: Mood, note: string) => {
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood,
      note,
      timestamp: Date.now(),
    };
    setMoods(prev => [...prev, newEntry]);
  };

  const handleToggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => 
      h.id === id ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? h.streak : h.streak + 1 } : h
    ));
  };

  const getCurrentMood = () => moods.length > 0 ? moods[moods.length - 1].mood : null;

  // Show Onboarding if needed
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col md:flex-row bg-[#f3e5f5]">
        {/* Background Gradient is actually on body, but container helps structure */}
        
        {/* Navigation */}
        <nav className={`
            fixed bottom-0 left-0 right-0 z-50 h-20 
            md:relative md:w-24 md:h-screen md:sticky md:top-0
            ${STYLES.glassCard} rounded-none md:rounded-r-3xl md:rounded-l-none border-l-0 border-r border-t md:border-t-0
            flex md:flex-col items-center justify-around md:justify-center md:gap-8 md:py-8
            pb-safe md:pb-0
        `}>
          <div className="hidden md:block mb-4">
            <Mascot mood="happy" className="w-12 h-12" />
          </div>

          <NavItem to="/" icon={<LayoutDashboard size={24} />} label="Home" />
          <NavItem to="/plan" icon={<BrainCircuit size={24} />} label="Plan" />
          <NavItem to="/focus" icon={<Timer size={24} />} label="Focus" />
          <NavItem to="/chat" icon={<MessageCircleHeart size={24} />} label="Chat" />
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
            <AnimatedRoutes 
                moods={moods} 
                habits={habits} 
                userContext={userContext}
                handleLogMood={handleLogMood}
                handleToggleHabit={handleToggleHabit}
                getCurrentMood={getCurrentMood}
            />
        </main>
      </div>
    </HashRouter>
  );
};

// Nav Helper
const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      p-3 rounded-2xl transition-all duration-300 flex flex-col items-center gap-1 relative
      ${isActive ? 'text-white' : 'text-gray-500 hover:bg-white/50'}
    `}
  >
    {({ isActive }) => (
        <>
            {isActive && (
                <motion.div 
                    layoutId="navHighlight"
                    className="absolute inset-0 bg-[#66DCDC] rounded-2xl shadow-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            {icon}
            <span className="text-[10px] font-medium md:hidden">{label}</span>
        </>
    )}
  </NavLink>
);

export default App;

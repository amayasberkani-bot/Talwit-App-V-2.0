
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, MessageCircleHeart, BrainCircuit, Timer, Settings as SettingsIcon, Play, BarChart2, ArrowRight, LogOut, Globe } from 'lucide-react';
import { Mood, MoodEntry, Habit, UserContext } from './types';
import MoodTracker from './components/MoodTracker';
import ChatCompanion from './components/ChatCompanion';
import StudyPlanGenerator from './components/StudyPlanGenerator';
import HabitList from './components/HabitList';
import GrowthGarden from './components/GrowthGarden';
import StudyStats from './components/StudyStats';
import StudyStatsPreview from './components/StudyStatsPreview';
import FocusTimer from './components/FocusTimer';
import OnboardingFlow from './components/OnboardingFlow';
import SettingsPage from './components/SettingsPage';
import AuthPage from './components/AuthPage'; // Import Auth UI
import AgendaList from './components/AgendaList'; // New Component
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { STYLES, Mascot, ANIMATIONS, TYPOGRAPHY } from './constants';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged, signOut, User } from 'firebase/auth'; // Import Firebase Auth
import { auth, saveUserPreferences, getUserPreferences } from './services/firebase';

// --- Dashboard Component ---
const Dashboard: React.FC<{
  moods: MoodEntry[],
  habits: Habit[],
  userContext: UserContext | null,
  onLogMood: (m: Mood, n: string) => void
}> = ({ moods, habits, userContext, onLogMood }) => {
  const { t } = useSettings();
  const currentMood = moods.length > 0 ? moods[moods.length - 1].mood : null;

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-8 mt-4 md:mt-8"
      variants={ANIMATIONS.containerStagger}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Header Section */}
      <motion.div variants={ANIMATIONS.fadeIn} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className={TYPOGRAPHY.h1}>
                {t('dashboard.welcome')}, {userContext?.name || 'Student'}
            </h1>
            <p className={TYPOGRAPHY.body}>{t('dashboard.subtitle')}</p>
        </div>
        <Link to="/plan" className="text-sm font-medium text-[var(--primary)] hover:underline flex items-center gap-1">
            {t('dashboard.viewSchedule')} <ArrowRight size={14} className="rtl:rotate-180" />
        </Link>
      </motion.div>

      {/* 2. Mood Check-In (Core Feature) */}
      <motion.div variants={ANIMATIONS.fadeIn}>
        <MoodTracker onLogMood={onLogMood} currentMood={currentMood} />
      </motion.div>

      {/* 3. NEW: Agenda & Action Grid */}
      <motion.div variants={ANIMATIONS.fadeIn} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* New Agenda List */}
        <div className="h-full min-h-[300px]">
           <AgendaList />
        </div>

        {/* Action Cards Wrapper */}
        <div className="flex flex-col gap-4">
             {/* Deep Focus Card */}
            <Link 
                to="/focus" 
                className={`${STYLES.glassCard} p-6 relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl flex-1`}
            >
                <div className="relative z-10 flex flex-col h-full justify-between min-h-[120px]">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-teal-100/50 rounded-xl text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 backdrop-blur-sm">
                                <Timer size={20} />
                            </div>
                            <h3 className={TYPOGRAPHY.h3}>{t('card.focus.title')}</h3>
                        </div>
                        <p className={TYPOGRAPHY.small}>{t('card.focus.desc')}</p>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--primary)]/20 transition-colors"></div>
                <Play className="absolute bottom-6 right-6 w-12 h-12 text-[var(--primary)] opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 rtl:left-6 rtl:right-auto" />
            </Link>

            {/* Analytics Shortcut Card */}
            <Link 
                to="/focus" 
                className={`${STYLES.glassCard} p-6 relative overflow-hidden group hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl flex-1`}
            >
                <div className="relative z-10 flex flex-col h-full justify-between min-h-[120px]">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100/50 rounded-xl text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 backdrop-blur-sm">
                                <BarChart2 size={20} />
                            </div>
                            <h3 className={TYPOGRAPHY.h3}>{t('card.overview.title')}</h3>
                        </div>
                        <p className={TYPOGRAPHY.small}>
                            <span className="font-bold text-[var(--text-main)]">
                            <StudyStatsPreviewSummary />
                            </span> {t('card.overview.desc')}
                        </p>
                    </div>
                    
                    {/* Visual Chart Preview */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 w-full opacity-60 group-hover:opacity-100 transition-all duration-500">
                        <StudyStatsPreview />
                    </div>
                </div>
            </Link>
        </div>

      </motion.div>
    </motion.div>
  );
};

// --- Mini Component to get Summary inside Dashboard ---
const StudyStatsPreviewSummary = () => {
    return <span>Tracked</span>;
}

// --- Navigation Component ---
const Navigation = () => {
  const { t } = useSettings();
  return (
    <nav className={`
        fixed bottom-0 left-0 right-0 z-50 h-20 
        md:relative md:w-24 md:h-screen md:sticky md:top-0
        ${STYLES.glassCard} rounded-none md:rounded-r-3xl md:rounded-l-none border-l-0 border-r border-t md:border-t-0
        flex md:flex-col items-center justify-around md:justify-center md:gap-8 md:py-8
        pb-safe md:pb-0
        rtl:md:rounded-l-3xl rtl:md:rounded-r-none rtl:border-l rtl:border-r-0
    `}>
      <div className="hidden md:block mb-4">
        <Mascot mood="happy" className="w-12 h-12" />
      </div>

      <NavItem to="/" icon={<LayoutDashboard size={24} />} label={t('nav.home')} />
      <NavItem to="/plan" icon={<BrainCircuit size={24} />} label={t('nav.plan')} />
      <NavItem to="/focus" icon={<Timer size={24} />} label={t('nav.focus')} />
      <NavItem to="/chat" icon={<MessageCircleHeart size={24} />} label={t('nav.chat')} />
      
      {/* Logout Button */}
      <button
        onClick={() => signOut(auth)}
        className="hidden md:flex p-3 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all flex-col items-center gap-1 mt-auto"
        title="Sign Out"
      >
        <LogOut size={24} />
      </button>

    </nav>
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
            />
          </PageWrapper>
        } />
        <Route path="/plan" element={<PageWrapper><StudyPlanGenerator /></PageWrapper>} />
        
        {/* REFACTORED FOCUS ROUTE FOR MOBILE VISIBILITY */}
        <Route path="/focus" element={
            <PageWrapper>
                {/* 
                   Mobile-First Refactor:
                   1. flex-col on mobile (stacking), md:grid on desktop.
                   2. h-auto on mobile (allows scrolling), md:h-full on desktop.
                   3. pb-24 on mobile ensures last element clears the bottom nav.
                */}
                <div className="flex flex-col md:grid md:grid-cols-2 gap-6 w-full h-auto md:h-full max-w-6xl mx-auto pb-24 md:pb-0">
                    
                    {/* Left Col (Timer): Fixed height on mobile to allow visibility, auto on desktop */}
                    <div className="w-full h-[500px] md:h-auto order-1 md:order-none shrink-0">
                        <FocusTimer />
                    </div>

                    {/* Right Col (Stats & Habits): Stacked */}
                    <div className="flex flex-col gap-6 w-full h-auto md:h-full order-2 md:order-none">
                         
                         {/* Stats: Fixed height on mobile to prevent collapse */}
                         <div className="w-full h-[400px] md:h-auto shrink-0">
                            <StudyStats />
                         </div>

                         {/* Habits: Fixed height on mobile, fills remaining space on desktop */}
                         <div className="w-full h-[400px] md:h-auto md:flex-1 shrink-0">
                            <HabitList habits={habits} onToggleHabit={handleToggleHabit} />
                         </div>
                    </div>
                </div>
            </PageWrapper>
        } />

        <Route path="/chat" element={
            <PageWrapper>
                <div className="max-w-4xl mx-auto">
                    <ChatCompanion currentMood={getCurrentMood()} userContext={userContext} />
                </div>
            </PageWrapper>
        } />
        <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

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

// --- Settings Shortcut Component ---
const SettingsShortcut = () => {
  const location = useLocation();
  const { dir, settings, updateSetting } = useSettings();

  if (location.pathname !== '/') return null;

  const toggleLanguage = () => {
      const nextLang = settings.language === 'en' ? 'fr' : settings.language === 'fr' ? 'ar' : 'en';
      updateSetting('language', nextLang);
  };

  return (
    <div className={`absolute top-4 md:top-6 z-40 flex items-center gap-2 ${
        dir === 'rtl' ? 'left-4 md:left-8' : 'right-4 md:right-8'
    }`}>
        {/* Quick Language Toggle */}
        <button
            onClick={toggleLanguage}
            className="p-2.5 rounded-full bg-[var(--card-bg)]/80 backdrop-blur-sm border border-[var(--card-border)] shadow-sm text-[var(--text-secondary)] hover:text-[var(--primary)] font-bold text-xs w-10 h-10 flex items-center justify-center transition-all"
            title="Switch Language"
        >
            {settings.language.toUpperCase()}
        </button>

        <button
            onClick={() => signOut(auth)}
            className="md:hidden p-2.5 rounded-full bg-[var(--card-bg)]/80 backdrop-blur-sm border border-[var(--card-border)] shadow-sm text-red-400"
            title="Sign Out"
        >
            <LogOut size={20} />
        </button>
        <Link 
            to="/settings"
            className="p-2.5 rounded-full bg-[var(--card-bg)]/80 backdrop-blur-sm border border-[var(--card-border)] shadow-sm hover:bg-[var(--primary)] hover:text-[var(--text-on-primary)] transition-all"
            title="Settings"
        >
            <SettingsIcon size={20} />
        </Link>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', title: 'Drink Water', streak: 5, completedToday: false, icon: '💧' },
    { id: '2', title: 'Read 10 pages', streak: 2, completedToday: false, icon: '📚' },
    { id: '3', title: 'Mindful Breathing', streak: 12, completedToday: true, icon: '🧘' },
    { id: '4', title: 'Sleep 8 Hours', streak: 1, completedToday: false, icon: '😴' },
  ]);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false); // Changed default to false to prevent flicker before auth check
  const { dir } = useSettings();

  // --- Auth State ---
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 1. Listen for Authentication & Fetch Preferences
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setFirebaseUser(user);
          
          if (user) {
              // Try to load context from Firestore to sync across devices
              try {
                  const prefs = await getUserPreferences(user.uid);
                  if (prefs) {
                      setUserContext(prefs);
                      localStorage.setItem('talwit_user_context', JSON.stringify(prefs));
                      setShowOnboarding(false);
                  } else {
                      // No prefs in Firestore, check local storage
                      const localContext = localStorage.getItem('talwit_user_context');
                      if (localContext) {
                           setUserContext(JSON.parse(localContext));
                           setShowOnboarding(false);
                      } else {
                           // No local, no remote -> New User needing onboarding
                           setShowOnboarding(true);
                      }
                  }
              } catch (e) {
                  console.error("Error loading user context", e);
                  // Fallback to local
                  const localContext = localStorage.getItem('talwit_user_context');
                  if (localContext) {
                       setUserContext(JSON.parse(localContext));
                       setShowOnboarding(false);
                  } else {
                       setShowOnboarding(true);
                  }
              }
          }
          
          setAuthLoading(false);
      });
      return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (context: UserContext) => {
    setUserContext(context);
    localStorage.setItem('talwit_user_context', JSON.stringify(context));
    
    // FEATURE: SAVE SURVEY TO FIRESTORE
    if (firebaseUser) {
        await saveUserPreferences(firebaseUser.uid, context);
    }
    
    setShowOnboarding(false);
  };

  const handleLogMood = (mood: Mood, note: string) => {
    setMoods(prev => [...prev, { id: Date.now().toString(), mood, note, timestamp: Date.now() }]);
  };

  const handleToggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => 
      h.id === id ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? h.streak : h.streak + 1 } : h
    ));
  };

  // --- Render Logic ---

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-gradient-start)]">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent"></div>
          </div>
      );
  }

  // If not logged in, show Auth Page
  if (!firebaseUser) {
      return <AuthPage />;
  }

  // If logged in but no profile data, show Onboarding
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // If authenticated and onboarded, show App
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col md:flex-row" dir={dir}>
        <Navigation />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden relative">
            <SettingsShortcut />

            <AnimatedRoutes 
                moods={moods} 
                habits={habits} 
                userContext={userContext}
                handleLogMood={handleLogMood}
                handleToggleHabit={handleToggleHabit}
                getCurrentMood={() => moods.length > 0 ? moods[moods.length - 1].mood : null}
            />
        </main>
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AnalyticsProvider>
         <AppContent />
      </AnalyticsProvider>
    </SettingsProvider>
  );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      p-3 rounded-2xl transition-all duration-300 flex flex-col items-center gap-1 relative
      ${isActive ? 'text-[var(--primary)] bg-[var(--primary)]/10' : 'text-[var(--text-muted)] hover:bg-[var(--input-bg)]'}
    `}
  >
    {({ isActive }) => (
        <>
            {isActive && (
                <motion.div 
                    layoutId="navHighlight"
                    className="absolute inset-0 border-l-4 border-[var(--primary)] md:border-l-0 md:border-r-4 rounded-r-none md:rounded-r-2xl rtl:border-l-0 rtl:border-r-4 rtl:md:border-r-0 rtl:md:border-l-4"
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


export type Mood = 'happy' | 'calm' | 'anxious' | 'tired' | 'stressed';

export interface MoodEntry {
  id: string;
  mood: Mood;
  note: string;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: 'study' | 'wellness' | 'other';
  durationMinutes?: number;
}

export interface AgendaItem {
  id: string;
  title: string;
  type: 'homework' | 'project' | 'event' | 'task';
  date: any; // Firestore Timestamp or Date
  isCompleted: boolean;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
  icon: string; // Emoji or icon name
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachment?: string; // Base64 string of the uploaded image
}

// Old StudyPlan (kept for backward compatibility if needed, but we are moving to WeeklySchedule)
export interface StudyPlan {
  id: string;
  goal: string;
  blocks: {
    activity: string;
    duration: string;
    type: 'focus' | 'break' | 'review';
  }[];
}

// --- New Weekly Schedule Types ---
export interface ScheduleBlock {
  id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  activity: string;
  type: 'fixed' | 'study' | 'wellness' | 'hobby' | 'meal';
  description?: string;
}

export interface DaySchedule {
  day: string; // "Monday", "Tuesday", etc.
  blocks: ScheduleBlock[];
}

export interface WeeklySchedule {
  weekId: string;
  days: DaySchedule[];
}

export type AmbientSound = 'none' | 'rain' | 'cafe' | 'forest';

export interface UserContext {
  name: string;
  studyField: string; 
  mainGoal: string; 
  productiveTime: string; 
  currentLoad: string; 
  wellnessStatus: string; 
  motivationStyle: string; 
  stressRelief: string; 
  hobbies: string; // New field for personalized suggestions
}

export interface OnboardingQuestion {
  id: keyof UserContext;
  question: string;
  type: 'text' | 'choice';
  options?: string[];
  placeholder?: string;
  description?: string;
}

// --- Analytics Types ---
export interface DailyStudyData {
    date: string; // ISO YYYY-MM-DD
    minutes: number;
}

export interface ActivityLog {
    id: string;
    action: string;
    timestamp: number;
}

// --- Settings & i18n Types ---

export type Language = 'en' | 'fr' | 'ar';
export type Theme = 'light' | 'dark' | 'calm';

export interface AppSettings {
  language: Language;
  theme: Theme;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  notifications: {
    study: boolean;
    wellness: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'light',
  reducedMotion: false,
  fontSize: 'medium',
  notifications: {
    study: true,
    wellness: true
  }
};

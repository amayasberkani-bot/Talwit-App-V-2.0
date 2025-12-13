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
}

export interface StudyPlan {
  id: string;
  goal: string;
  blocks: {
    activity: string;
    duration: string;
    type: 'focus' | 'break' | 'review';
  }[];
}

export type AmbientSound = 'none' | 'rain' | 'cafe' | 'forest';

export interface UserContext {
  name: string;
  studyField: string; // What are they studying?
  mainGoal: string; // Grades, Balance, Survival?
  productiveTime: string; // Morning, Night?
  currentLoad: string; // Heavy, Light?
  wellnessStatus: string; // Sleep/Energy
  motivationStyle: string; // Gentle vs Planner
  stressRelief: string; // What helps them?
}

export interface OnboardingQuestion {
  id: keyof UserContext;
  question: string;
  type: 'text' | 'choice';
  options?: string[];
  placeholder?: string;
  description?: string;
}

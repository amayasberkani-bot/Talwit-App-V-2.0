import React, { createContext, useContext, useState, useEffect } from 'react';
import { DailyStudyData, ActivityLog } from '../types';

interface AnalyticsContextType {
  studyData: Record<string, number>; // date string -> minutes
  recentActions: ActivityLog[];
  addStudyMinutes: (minutes: number) => void;
  logAction: (action: string) => void;
  getChartData: (range: 'week' | 'month' | 'year') => { name: string; hours: number }[];
  totalStudyMinutesToday: number;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return context;
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence for Study Data
  const [studyData, setStudyData] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('talwit_analytics');
    return saved ? JSON.parse(saved) : {};
  });

  // Ephemeral or Session-based logs for AI Context (could be persisted if needed)
  const [recentActions, setRecentActions] = useState<ActivityLog[]>([]);

  useEffect(() => {
    localStorage.setItem('talwit_analytics', JSON.stringify(studyData));
  }, [studyData]);

  // --- Core Actions ---

  const addStudyMinutes = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setStudyData(prev => ({
      ...prev,
      [today]: (prev[today] || 0) + minutes
    }));
  };

  const logAction = (action: string) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      action,
      timestamp: Date.now()
    };
    // Keep last 20 actions for AI context
    setRecentActions(prev => [...prev.slice(-19), newLog]);
  };

  const totalStudyMinutesToday = studyData[new Date().toISOString().split('T')[0]] || 0;

  // --- Data Transformation for Charts ---

  const getChartData = (range: 'week' | 'month' | 'year') => {
    const today = new Date();
    const data: { name: string; hours: number }[] = [];

    if (range === 'week') {
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const mins = studyData[dateKey] || 0;
        data.push({
          name: days[d.getDay()],
          hours: parseFloat((mins / 60).toFixed(2))
        });
      }
    } else if (range === 'month') {
      // Last 4 weeks (simplified)
      for (let i = 3; i >= 0; i--) {
        // Mocking aggregation for simplicity in this demo, usually requires complex date math
        // We will just map random historical data or 0 if empty for this demo structure
        data.push({ name: `W${4 - i}`, hours: 0 }); 
      }
      // Populate current week in W4
      const currentWeekTotal = Object.entries(studyData)
        .filter(([date]) => {
            const d = new Date(date);
            const diff = Math.abs(today.getTime() - d.getTime());
            return diff < 7 * 24 * 60 * 60 * 1000;
        })
        .reduce((acc, [, val]) => acc + val, 0);
      data[3].hours = parseFloat((currentWeekTotal / 60).toFixed(2));
      
    } else {
        // Year view (Months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach((m, idx) => {
            // Aggregate by month index logic here
            // For demo, just showing structure
            data.push({ name: m, hours: idx === today.getMonth() ? parseFloat((totalStudyMinutesToday/60).toFixed(2)) : 0 });
        });
    }

    return data;
  };

  return (
    <AnalyticsContext.Provider value={{ 
      studyData, 
      recentActions, 
      addStudyMinutes, 
      logAction, 
      getChartData,
      totalStudyMinutesToday
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
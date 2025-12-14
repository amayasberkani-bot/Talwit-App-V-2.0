import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS, Language } from '../types';
import { translations } from '../services/translations';
import { MotionConfig } from 'framer-motion';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  resetAllData: () => void;
  resetOnboarding: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};

// --- Sync Service Abstraction ---
// This acts as the architectural layer for future cloud persistence (e.g. Firebase)
const syncSettingsWithCloud = async (settings: AppSettings) => {
  // Placeholder for: await firebase.firestore().collection('users').doc(uid).update({ settings });
  console.log('[SyncService] Settings synced to cloud:', settings);
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('talwit_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // --- Global Effect Layer ---
  // Responsible for applying settings to the DOM dynamically
  useEffect(() => {
    // 1. Persistence
    localStorage.setItem('talwit_settings', JSON.stringify(settings));
    syncSettingsWithCloud(settings); // Trigger cloud sync
    
    // 2. Language & Direction
    const dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = settings.language;
    
    // 3. Typography
    const fontScale = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';
    document.documentElement.style.setProperty('--base-font-size', fontScale);

    // 4. Theming (Clean up old classes before adding new one)
    document.body.classList.remove('dark-theme', 'calm-theme');
    if (settings.theme !== 'light') {
      document.body.classList.add(`${settings.theme}-theme`);
    }

  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const t = (key: string): string => {
    const langData = translations[settings.language] || translations['en'];
    return langData[key] || key;
  };

  const resetAllData = () => {
    if (window.confirm(t('settings.clearDataDesc'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem('talwit_user_context');
    window.location.reload();
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSetting, 
      t, 
      dir: settings.language === 'ar' ? 'rtl' : 'ltr',
      resetAllData,
      resetOnboarding
    }}>
      {/* Motion Config applies Reduced Motion preference globally */}
      <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "never"}>
        {children}
      </MotionConfig>
    </SettingsContext.Provider>
  );
};

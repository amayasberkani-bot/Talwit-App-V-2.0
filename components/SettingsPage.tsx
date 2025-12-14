import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { STYLES, ANIMATIONS, TYPOGRAPHY } from '../constants';
import { motion } from 'framer-motion';
import { 
  User, Globe, Bell, Moon, Sun, 
  Trash2, RefreshCcw, Type, 
  CheckCircle2, ChevronRight, ChevronLeft,
  Coffee, Shield
} from 'lucide-react';
import { Theme } from '../types';

const SettingsPage: React.FC = () => {
  const { settings, updateSetting, t, dir, resetAllData, resetOnboarding } = useSettings();

  const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <motion.div 
      variants={ANIMATIONS.fadeIn}
      className={`${STYLES.glassCard} p-6 mb-6`}
    >
      <div className="flex items-center gap-3 mb-6 border-b border-[var(--card-border)] pb-4">
        <div className="p-2 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)]">
          {icon}
        </div>
        <h3 className={TYPOGRAPHY.h3}>{title}</h3>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </motion.div>
  );

  const Toggle = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!value)}>
      <span className={TYPOGRAPHY.body}>{label}</span>
      <div 
        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${value ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-slate-600'}`}
      >
        <motion.div 
          className="w-5 h-5 bg-white rounded-full shadow-sm"
          animate={{ x: value ? (dir === 'rtl' ? -20 : 20) : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className={TYPOGRAPHY.h1}>{t('settings.title')}</h2>
        <p className={TYPOGRAPHY.body}>Manage your experience and preferences</p>
      </motion.header>

      <motion.div variants={ANIMATIONS.containerStagger} initial="hidden" animate="visible">
        
        {/* Language Section */}
        <Section title={t('settings.language')} icon={<Globe size={20} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { code: 'en', label: 'English', flag: '🇺🇸' },
              { code: 'fr', label: 'Français', flag: '🇫🇷' },
              { code: 'ar', label: 'العربية', flag: '🇸🇦' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => updateSetting('language', lang.code as any)}
                className={`p-4 rounded-2xl flex flex-row md:flex-col items-center gap-3 transition-all ${
                  settings.language === lang.code ? STYLES.activeOption : STYLES.inactiveOption
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left md:text-center">
                    <span className="text-sm font-bold block">{lang.label}</span>
                </div>
                {settings.language === lang.code && <CheckCircle2 size={18} />}
              </button>
            ))}
          </div>
        </Section>

        {/* Appearance Section */}
        <Section title={t('settings.appearance')} icon={<Sun size={20} />}>
          <div className="mb-6">
            <label className={TYPOGRAPHY.label}>{t('settings.theme')}</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { id: 'light', label: t('settings.theme.light'), icon: <Sun size={18} /> },
                { id: 'dark', label: t('settings.theme.dark'), icon: <Moon size={18} /> },
                { id: 'calm', label: t('settings.theme.calm'), icon: <Coffee size={18} /> }
              ].map((themeOpt) => (
                <button
                  key={themeOpt.id}
                  onClick={() => updateSetting('theme', themeOpt.id as Theme)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all ${
                    settings.theme === themeOpt.id ? STYLES.activeOption : STYLES.inactiveOption
                  }`}
                >
                  {themeOpt.icon}
                  <span className="text-xs font-bold">{themeOpt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             <Toggle 
                label={t('settings.reducedMotion')} 
                value={settings.reducedMotion} 
                onChange={(v) => updateSetting('reducedMotion', v)} 
            />
            
             <div className="pt-4 border-t border-[var(--card-border)]">
                <div className="flex items-center justify-between mb-3">
                <span className={`${TYPOGRAPHY.body} flex items-center gap-2`}>
                    <Type size={16} /> Font Size
                </span>
                <span className={TYPOGRAPHY.caption}>{settings.fontSize}</span>
                </div>
                <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                    <button
                    key={size}
                    onClick={() => updateSetting('fontSize', size as any)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center ${
                        settings.fontSize === size 
                        ? 'bg-[var(--primary)] text-[var(--text-on-primary)] shadow-sm' 
                        : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg)]'
                    }`}
                    >
                      <span className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-lg' : 'text-sm'}>
                        Aa
                      </span>
                    </button>
                ))}
                </div>
             </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title={t('settings.notifications')} icon={<Bell size={20} />}>
          <div className="space-y-4">
            <Toggle 
                label="Study Reminders" 
                value={settings.notifications.study} 
                onChange={(v) => updateSetting('notifications', { ...settings.notifications, study: v })} 
            />
            <Toggle 
                label="Wellness Check-ins" 
                value={settings.notifications.wellness} 
                onChange={(v) => updateSetting('notifications', { ...settings.notifications, wellness: v })} 
            />
          </div>
        </Section>

        {/* Data & Privacy */}
        <Section title={t('settings.account')} icon={<User size={20} />}>
          <button 
            onClick={resetOnboarding}
            className={`${STYLES.secondaryButton} w-full p-4 flex items-center justify-between mb-3 text-left`}
          >
            <div className="flex items-center gap-3">
              <RefreshCcw size={18} className="text-blue-500" />
              <div>
                <p className="font-bold text-[var(--text-main)]">{t('settings.reset')}</p>
                <p className="text-xs text-[var(--text-secondary)]">{t('settings.resetDesc')}</p>
              </div>
            </div>
            {dir === 'rtl' ? <ChevronLeft size={18} className="text-[var(--text-muted)]" /> : <ChevronRight size={18} className="text-[var(--text-muted)]" />}
          </button>

          <button 
            onClick={resetAllData}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold text-red-700">{t('settings.clearData')}</p>
                <p className="text-xs text-red-500">{t('settings.clearDataDesc')}</p>
              </div>
            </div>
          </button>
          
          <div className="mt-4 flex items-center gap-2 justify-center text-xs text-[var(--text-muted)]">
             <Shield size={12} />
             <span>Data is stored locally on your device.</span>
          </div>
        </Section>

      </motion.div>
    </div>
  );
};

export default SettingsPage;
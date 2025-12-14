
import React, { useState } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, registerUserLogic } from '../services/firebase';
import { STYLES, TYPOGRAPHY, ANIMATIONS, Mascot } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const AuthPage: React.FC = () => {
    const { t } = useSettings();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // --- Login Logic ---
                await signInWithEmailAndPassword(auth, email, password);
                // No explicit alert needed as auth state change will redirect, but keeping logic just in case
            } else {
                // --- Register Logic ---
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await registerUserLogic(userCredential.user);
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') setError(t('common.error'));
            else setError(err.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${STYLES.glassCard} max-w-md w-full p-8 relative overflow-hidden`}
            >
                {/* Visual Header */}
                <div className="flex flex-col items-center mb-8">
                    <Mascot mood={isLogin ? "calm" : "happy"} className="w-24 h-24 mb-4" />
                    <h1 className={TYPOGRAPHY.h2}>
                        {isLogin ? t('auth.welcomeBack') : t('auth.join')}
                    </h1>
                    <p className={TYPOGRAPHY.body + " text-center mt-2 text-sm"}>
                        {isLogin ? t('auth.subtitleLogin') : t('auth.subtitleSignup')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-50 text-red-500 p-3 rounded-xl text-sm flex items-center gap-2 border border-red-100"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-1">
                        <label className={TYPOGRAPHY.label}>{t('auth.emailLabel')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] rtl:left-auto rtl:right-3" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`${STYLES.glassInput} w-full pl-10 rtl:pl-4 rtl:pr-10 py-3`}
                                placeholder={t('auth.emailPlaceholder')}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={TYPOGRAPHY.label}>{t('auth.passwordLabel')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] rtl:left-auto rtl:right-3" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${STYLES.glassInput} w-full pl-10 rtl:pl-4 rtl:pr-10 py-3`}
                                placeholder={t('auth.passwordPlaceholder')}
                                required
                            />
                        </div>
                    </div>

                    <motion.button 
                        whileTap={!loading ? ANIMATIONS.tap : {}}
                        disabled={loading}
                        type="submit"
                        className={`${STYLES.primaryButton} w-full py-3 mt-6 relative`}
                    >
                        {loading ? (
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                             <span className="flex items-center gap-2">
                                {isLogin ? <LogIn size={18} className="rtl:rotate-180" /> : <UserPlus size={18} />}
                                {isLogin ? t('auth.signIn') : t('auth.createAccount')}
                             </span>
                        )}
                    </motion.button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium"
                    >
                        {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;

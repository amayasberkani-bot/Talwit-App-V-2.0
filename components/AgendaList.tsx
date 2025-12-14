
import React, { useState, useEffect } from 'react';
import { AgendaItem } from '../types';
import { subscribeToAgenda, toggleAgendaItem, deleteAgendaItem, auth } from '../services/firebase';
import { STYLES, TYPOGRAPHY } from '../constants';
import { Calendar, CheckSquare, Square, Briefcase, Book, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext'; // Import context

const AgendaList: React.FC = () => {
  const { t } = useSettings(); // Use translations
  const [items, setItems] = useState<AgendaItem[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const unsubscribe = subscribeToAgenda(currentUser.uid, (data) => {
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = async (item: AgendaItem) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        await toggleAgendaItem(currentUser.uid, item.id, item.isCompleted);
    }
  };

  const handleDelete = async (itemId: string) => {
    const currentUser = auth.currentUser;
    if (currentUser && window.confirm(t('agenda.deleteConfirm'))) {
        try {
            await deleteAgendaItem(currentUser.uid, itemId);
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Could not delete task. Please try again.");
        }
    }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'homework': return <Book size={16} className="text-blue-500" />;
          case 'project': return <Briefcase size={16} className="text-purple-500" />;
          case 'event': return <Calendar size={16} className="text-orange-500" />;
          default: return <Sparkles size={16} className="text-teal-500" />;
      }
  };

  const formatDate = (date: any) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`${STYLES.glassCard} p-6 flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-4">
          <h3 className={TYPOGRAPHY.h3}>{t('agenda.title')}</h3>
          <span className="text-xs bg-[var(--input-bg)] px-2 py-1 rounded-lg text-[var(--text-secondary)]">
             {items.filter(i => !i.isCompleted).length} {t('agenda.pending')}
          </span>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        <AnimatePresence>
            {items.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                    <Calendar size={32} className="mx-auto mb-2" />
                    <p className="text-sm">{t('agenda.empty')}</p>
                </div>
            ) : (
                items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            item.isCompleted 
                            ? 'bg-[var(--input-bg)] border-transparent opacity-60' 
                            : 'bg-white/40 border-[var(--card-border)] shadow-sm'
                        }`}
                    >
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(item);
                            }}
                            className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                        >
                            {item.isCompleted ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm truncate ${item.isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                                {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] flex items-center gap-1">
                                    {getIcon(item.type)} {item.type}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <div className="text-xs font-semibold bg-[var(--input-bg)] px-2 py-1 rounded-lg text-[var(--text-secondary)] whitespace-nowrap">
                                {formatDate(item.date)}
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                }}
                                className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer z-10"
                                title="Delete Task"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgendaList;

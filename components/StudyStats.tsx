import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { STYLES, TYPOGRAPHY } from '../constants';
import { BarChart2, Clock, TrendingUp } from 'lucide-react';
import { useAnalytics } from '../contexts/AnalyticsContext';

type TimeRange = 'week' | 'month' | 'year';

const StudyStats: React.FC = () => {
  const { getChartData, totalStudyMinutesToday } = useAnalytics();
  const [range, setRange] = useState<TimeRange>('week');
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const currentData = getChartData(range);
  const totalHours = currentData.reduce((acc, curr) => acc + curr.hours, 0);

  // Custom Tooltip using Glassmorphism
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/20 text-xs">
          <p className="font-bold text-[var(--text-main)] mb-1">{label}</p>
          <p className="text-[var(--primary)] font-semibold">
            {payload[0].value} hrs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${STYLES.glassCard} p-6 flex flex-col h-full min-h-[350px]`}>
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className={`${TYPOGRAPHY.h3} flex items-center gap-2`}>
            <BarChart2 className="w-5 h-5 text-[var(--primary)]" /> Study Analytics
          </h3>
          <p className={TYPOGRAPHY.caption + " mt-1 normal-case text-[var(--text-secondary)]"}>
            Total: <span className="text-[var(--text-main)] font-bold">{totalHours.toFixed(1)}h</span> this {range}
          </p>
        </div>

        {/* iOS Style Segmented Control */}
        <div className="flex bg-[var(--input-bg)] p-1 rounded-2xl backdrop-blur-md self-start md:self-auto">
          {(['week', 'month', 'year'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-300 ${
                range === r
                  ? 'bg-[var(--primary)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-white/40'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state.isTooltipActive) {
                setFocusIndex(state.activeTooltipIndex);
              } else {
                setFocusIndex(null);
              }
            }}
          >
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar 
              dataKey="hours" 
              radius={[6, 6, 6, 6]} 
              animationDuration={500}
            >
              {currentData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={focusIndex === index ? 'var(--primary-hover)' : 'var(--primary)'}
                  fillOpacity={focusIndex === index ? 1 : 0.8}
                  style={{ transition: 'all 0.3s ease' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t border-[var(--card-border)] grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-full bg-blue-50 text-blue-500">
                <Clock size={16} />
             </div>
             <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Today</p>
                <p className="font-semibold text-sm text-[var(--text-main)]">
                    {(totalStudyMinutesToday / 60).toFixed(1)} hrs
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-full bg-green-50 text-green-500">
                <TrendingUp size={16} />
             </div>
             <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Score</p>
                <p className="font-semibold text-sm text-[var(--text-main)]">
                    Good
                </p>
             </div>
          </div>
      </div>

    </div>
  );
};

export default StudyStats;
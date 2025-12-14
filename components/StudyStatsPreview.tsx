import React from 'react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { useAnalytics } from '../contexts/AnalyticsContext';

const StudyStatsPreview: React.FC = () => {
  const { getChartData } = useAnalytics();
  const data = getChartData('week');

  return (
    <div className="h-full w-full select-none pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
           <Bar 
              dataKey="hours" 
              radius={[4, 4, 4, 4]} 
              animationDuration={1500} 
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.hours >= 4 ? 'var(--primary)' : 'var(--text-muted)'} 
                  fillOpacity={entry.hours >= 4 ? 1 : 0.3}
                />
              ))}
            </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudyStatsPreview;
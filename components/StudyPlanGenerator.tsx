import React, { useState } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { StudyPlan } from '../types';
import { STYLES } from '../constants';
import { Clock, BookOpen, Battery, Zap, Coffee, CheckCircle2 } from 'lucide-react';

const StudyPlanGenerator: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('2 hours');
  const [energy, setEnergy] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  const handleGenerate = async () => {
    if (!subject) return;
    setLoading(true);
    try {
      const result = await generateStudyPlan(subject, duration, energy);
      setPlan({ id: Date.now().toString(), ...result });
    } catch (e) {
      alert("Something went wrong generating the plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${STYLES.glassCard} p-6 h-full flex flex-col`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#66DCDC]" /> Smart Plan
      </h3>

      {!plan ? (
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject / Topic</label>
            <div className="relative">
                <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Organic Chemistry"
                    className={`${STYLES.glassInput} pl-9 w-full p-2`}
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)}
                        className={`${STYLES.glassInput} pl-9 w-full p-2 appearance-none`}
                    >
                        <option>1 hour</option>
                        <option>2 hours</option>
                        <option>3 hours</option>
                        <option>4 hours</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Energy Level</label>
                <div className="relative">
                    <Battery className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select 
                        value={energy} 
                        onChange={(e) => setEnergy(e.target.value)}
                        className={`${STYLES.glassInput} pl-9 w-full p-2 appearance-none`}
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className={`${STYLES.primaryButton} w-full py-3 mt-4 flex justify-center items-center gap-2`}
          >
            {loading ? 'Designing Plan...' : 'Generate Plan'}
          </button>
        </div>
      ) : (
        <div className="animate-fade-in flex-1 overflow-y-auto">
           <div className="flex justify-between items-start mb-4">
               <div>
                 <h4 className="font-bold text-gray-800">{subject}</h4>
                 <p className="text-xs text-gray-500">{plan.goal}</p>
               </div>
               <button onClick={() => setPlan(null)} className="text-xs text-[#66DCDC] underline">New</button>
           </div>
           
           <div className="space-y-3 relative">
                {/* Timeline Line */}
                <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-gray-200"></div>

               {plan.blocks.map((block, idx) => (
                   <div key={idx} className="relative flex items-center gap-3 pl-8">
                       <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white z-10 ${
                           block.type === 'break' ? 'border-green-400 text-green-500' : 
                           block.type === 'review' ? 'border-purple-400 text-purple-500' : 'border-[#66DCDC] text-[#66DCDC]'
                       }`}>
                           {block.type === 'break' ? <Coffee size={12}/> : block.type === 'review' ? <CheckCircle2 size={12}/> : <BookOpen size={12}/>}
                       </div>
                       <div className={`flex-1 p-3 rounded-xl border ${
                           block.type === 'break' ? 'bg-green-50/50 border-green-100' : 'bg-white/50 border-white/60'
                       }`}>
                           <div className="flex justify-between items-center mb-1">
                               <span className="font-medium text-sm text-gray-800">{block.type.toUpperCase()}</span>
                               <span className="text-xs font-mono bg-white/60 px-2 py-0.5 rounded-full text-gray-500">{block.duration}</span>
                           </div>
                           <p className="text-sm text-gray-600">{block.activity}</p>
                       </div>
                   </div>
               ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanGenerator;

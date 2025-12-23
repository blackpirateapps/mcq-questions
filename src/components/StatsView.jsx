import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, Zap, HelpCircle, Dices, 
  CheckCircle2, XCircle, MinusCircle, TrendingUp,
  Target, Edit2, Check, X, Clock, Timer
} from 'lucide-react';
import { db } from '../lib/db';

export default function StatsView() {
  const [timeRange, setTimeRange] = useState('weekly');
  const [sessions, setSessions] = useState([]);
  
  // --- Goal State ---
  const [goals, setGoals] = useState({ daily: 50, weekly: 350, monthly: 1500 });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(50);

  // Load goals from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('study-goals');
    if (saved) {
      setGoals(JSON.parse(saved));
    }
  }, []);

  // Update temp input when range or goals change
  useEffect(() => {
    setGoalInput(goals[timeRange]);
    setIsEditingGoal(false);
  }, [timeRange, goals]);

  const saveGoal = () => {
    const newGoals = { ...goals, [timeRange]: Math.max(1, parseInt(goalInput) || 1) };
    setGoals(newGoals);
    localStorage.setItem('study-goals', JSON.stringify(newGoals));
    setIsEditingGoal(false);
  };

  // --- Stats State ---
  const [stats, setStats] = useState({
    sessions: 0,
    correct: 0, wrong: 0, skipped: 0,
    confident: { correct: 0, wrong: 0, total: 0 },
    unsure: { correct: 0, wrong: 0, total: 0 },
    guessing: { correct: 0, wrong: 0, total: 0 },
    // --- NEW ---
    totalTime: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      const now = new Date();
      let startDate = new Date();
      
      // Calculate start date based on range
      if (timeRange === 'daily') startDate.setHours(0,0,0,0);
      if (timeRange === 'weekly') startDate.setDate(now.getDate() - 7);
      if (timeRange === 'monthly') startDate.setMonth(now.getMonth() - 1);

      // Fetch sessions
      const loadedSessions = await db.sessions
        .where('timestamp')
        .aboveOrEqual(startDate)
        .toArray();

      setSessions(loadedSessions);

      // --- Aggregation Logic ---
      const agg = loadedSessions.reduce((acc, session) => {
        acc.sessions++;
        // Accumulate time (fallback to 0 if missing in old data)
        acc.totalTime += (session.stats?.totalDuration || 0);
        
        const results = session.results || {};
        const confMap = session.confidenceMap || {};
        
        Object.entries(results).forEach(([qId, status]) => {
           if (status === 'skipped') {
             acc.skipped++;
             return;
           }
           
           // If not skipped, determine confidence (default to 'confident')
           const confidence = confMap[qId] || 'confident'; 
           
           // Global Totals
           if (status === 'correct') {
             acc.correct++;
             // Confidence Specific
             if (acc[confidence]) {
                acc[confidence].correct++;
                acc[confidence].total++;
             }
           } else if (status === 'wrong') {
             acc.wrong++;
             // Confidence Specific
             if (acc[confidence]) {
                acc[confidence].wrong++;
                acc[confidence].total++;
             }
           }
        });
        
        return acc;
      }, {
        sessions: 0,
        correct: 0, wrong: 0, skipped: 0,
        confident: { correct: 0, wrong: 0, total: 0 },
        unsure: { correct: 0, wrong: 0, total: 0 },
        guessing: { correct: 0, wrong: 0, total: 0 },
        totalTime: 0
      });

      setStats(agg);
    };
    loadStats();
  }, [timeRange]);

  // Helper to calculate percentage safely
  const getAcc = (correct, total) => total > 0 ? Math.round((correct / total) * 100) : 0;
  
  const globalTotal = stats.correct + stats.wrong;
  const globalAccuracy = getAcc(stats.correct, globalTotal);

  // Goal Calculations
  const currentGoal = goals[timeRange];
  const goalProgress = Math.min(100, Math.round((globalTotal / currentGoal) * 100));

  // --- NEW: Time Formatters ---
  const formatTotalTime = (ms) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };
  
  const avgTimePerQuestion = globalTotal > 0 ? Math.round((stats.totalTime / globalTotal) / 1000) : 0;

  // Sub-component for the breakdown cards
  const StatCard = ({ label, icon: Icon, data, color, bg, border }) => {
    const accuracy = getAcc(data.correct, data.total);
    
    return (
      <div className={`p-5 rounded-2xl border ${bg} ${border} shadow-sm flex flex-col justify-between`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-white/60 ${color}`}>
              <Icon size={18} />
            </div>
            <span className={`font-semibold ${color.replace('text-', 'text-opacity-80 ')}`}>{label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{accuracy}%</div>
        </div>
        
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden">
             <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${accuracy}%` }} />
          </div>
          
          {/* Details */}
          <div className="flex justify-between text-xs font-medium text-gray-500 pt-1">
             <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> {data.correct} Correct</span>
             <span className="flex items-center gap-1"><XCircle size={12} className="text-red-500"/> {data.wrong} Wrong</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto w-full animate-in fade-in p-2 md:p-6 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <BarChart3 className="text-blue-600" /> Performance Analytics
           </h2>
           <p className="text-gray-500 text-sm mt-1">Aggregated statistics for the selected period.</p>
        </div>
        <div className="flex bg-gray-200 rounded-lg p-1 self-start">
          {['daily', 'weekly', 'monthly'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${timeRange === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Goal & Progress Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
          <Target size={140} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
           <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2 text-blue-100 uppercase text-xs font-bold tracking-wider">
                <Target size={14} /> {timeRange} Goal
              </div>
              
              <div className="flex items-end gap-3 mb-4">
                {isEditingGoal ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      autoFocus
                      className="text-4xl font-bold bg-white/20 border border-blue-400 rounded-lg w-32 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                    />
                    <div className="flex flex-col gap-1">
                      <button onClick={saveGoal} className="p-1 bg-white/20 hover:bg-white/40 rounded text-white"><Check size={16}/></button>
                      <button onClick={() => setIsEditingGoal(false)} className="p-1 bg-white/10 hover:bg-white/30 rounded text-white/80"><X size={16}/></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-5xl font-bold">{globalTotal}</span>
                    <span className="text-blue-200 text-lg font-medium mb-1">/ {currentGoal} questions</span>
                    <button onClick={() => setIsEditingGoal(true)} className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors mb-1">
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out" 
                  style={{ width: `${goalProgress}%` }} 
                />
              </div>
           </div>

           <div className="flex gap-8 md:border-l md:border-white/10 md:pl-8">
              <div className="text-center">
                 <div className="text-2xl font-bold">{Math.max(0, currentGoal - globalTotal)}</div>
                 <div className="text-xs text-blue-200 uppercase font-medium mt-1">Remaining</div>
              </div>
              <div className="text-center">
                 <div className="text-2xl font-bold">{goalProgress}%</div>
                 <div className="text-xs text-blue-200 uppercase font-medium mt-1">Complete</div>
              </div>
           </div>
        </div>
      </div>

      {/* Global Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Accuracy</div>
            <div className="text-4xl font-bold text-gray-800">{globalAccuracy}<span className="text-lg text-gray-400 font-medium">%</span></div>
          </div>
          <TrendingUp className="absolute right-4 bottom-4 text-gray-100" size={60} />
        </div>

        {/* --- NEW: Time Stats Card --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Time Spent</div>
          <div className="flex items-center gap-2 mb-1">
             <Clock size={24} className="text-blue-500"/>
             <span className="text-3xl font-bold text-gray-800">{formatTotalTime(stats.totalTime)}</span>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
             <Timer size={10} /> ~{avgTimePerQuestion}s per question
          </div>
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex flex-col justify-center">
          <div className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Total Correct</div>
          <div className="text-3xl font-bold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 size={24} /> {stats.correct}
          </div>
        </div>

        <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100 flex flex-col justify-center">
          <div className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1">Total Wrong</div>
          <div className="text-3xl font-bold text-red-600 flex items-center gap-2">
            <XCircle size={24} /> {stats.wrong}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Grid */}
      <h3 className="text-lg font-bold text-gray-700 mb-4 ml-1">Confidence Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard 
          label="Confident" 
          icon={Zap} 
          data={stats.confident}
          bg="bg-blue-50/40"
          border="border-blue-100"
          color="text-blue-600"
        />
        <StatCard 
          label="Unsure" 
          icon={HelpCircle} 
          data={stats.unsure}
          bg="bg-amber-50/40"
          border="border-amber-100"
          color="text-amber-500"
        />
        <StatCard 
          label="Guessing" 
          icon={Dices} 
          data={stats.guessing}
          bg="bg-purple-50/40"
          border="border-purple-100"
          color="text-purple-500"
        />
      </div>

      {/* Recent Activity List (Simplified) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
           <h3 className="font-semibold text-gray-700">Recent Sessions</h3>
           <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">Last {sessions.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Tags</th>
                <th className="px-6 py-3 font-medium text-center">Score</th>
                <th className="px-6 py-3 font-medium text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.slice(0, 10).map(sess => (
                <tr key={sess.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-700">
                    {new Date(sess.timestamp).toLocaleDateString()}
                    <div className="text-[10px] text-gray-400">{new Date(sess.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {sess.tags.slice(0,3).map(t => <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs border border-blue-100">{t}</span>)}
                      {sess.tags.length > 3 && <span className="text-xs text-gray-400">+{sess.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center font-mono">
                    <span className="text-emerald-600 font-bold">{sess.stats.correct}</span> / 
                    <span className="text-red-500 font-bold ml-1">{sess.stats.wrong}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                     <span className={`font-bold ${sess.stats.accuracy >= 0.8 ? 'text-emerald-600' : sess.stats.accuracy >= 0.5 ? 'text-amber-500' : 'text-red-500'}`}>
                       {Math.round(sess.stats.accuracy * 100)}%
                     </span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No activity recorded for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
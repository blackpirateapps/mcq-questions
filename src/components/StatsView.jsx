import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, Zap, HelpCircle, Dices, 
  CheckCircle2, XCircle, MinusCircle, TrendingUp 
} from 'lucide-react';
import { db } from '../lib/db';

export default function StatsView() {
  const [timeRange, setTimeRange] = useState('weekly');
  const [sessions, setSessions] = useState([]);
  
  // Extended State for detailed stats
  const [stats, setStats] = useState({
    sessions: 0,
    correct: 0, wrong: 0, skipped: 0,
    confident: { correct: 0, wrong: 0, total: 0 },
    unsure: { correct: 0, wrong: 0, total: 0 },
    guessing: { correct: 0, wrong: 0, total: 0 }
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
        guessing: { correct: 0, wrong: 0, total: 0 }
      });

      setStats(agg);
    };
    loadStats();
  }, [timeRange]);

  // Helper to calculate percentage safely
  const getAcc = (correct, total) => total > 0 ? Math.round((correct / total) * 100) : 0;
  
  const globalTotal = stats.correct + stats.wrong;
  const globalAccuracy = getAcc(stats.correct, globalTotal);

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

      {/* Global Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Accuracy</div>
            <div className="text-4xl font-bold text-gray-800">{globalAccuracy}<span className="text-lg text-gray-400 font-medium">%</span></div>
          </div>
          <TrendingUp className="absolute right-4 bottom-4 text-gray-100" size={60} />
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

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
           <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Sessions / Skipped</div>
           <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-800">{stats.sessions}</span>
              <span className="text-xs text-gray-400">sessions</span>
           </div>
           <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <MinusCircle size={10} /> {stats.skipped} questions skipped
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
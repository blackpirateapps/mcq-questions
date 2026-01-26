import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, Download, Trash2, ChevronDown, ChevronUp, 
  CheckCircle2, XCircle, MinusCircle, HelpCircle, Dices, Zap, List, Clock, Timer, RotateCcw
} from 'lucide-react';
import { db } from '../lib/db';

const formatDuration = (ms) => {
  if (!ms) return '0s';
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// Helper to calculate detailed stats from raw session data
const calculateExtendedStats = (session) => {
  const stats = {
    correct: 0, wrong: 0, skipped: 0,
    confident: { correct: 0, wrong: 0, total: 0 },
    unsure: { correct: 0, wrong: 0, total: 0 },
    guessing: { correct: 0, wrong: 0, total: 0 }
  };

  const results = session.results || {};
  const confidenceMap = session.confidenceMap || {};

  Object.entries(results).forEach(([qId, status]) => {
    if (status === 'skipped') {
      stats.skipped++;
      return;
    }
    const confidence = confidenceMap[qId] || 'confident';

    if (status === 'correct') {
      stats.correct++;
      if (stats[confidence]) stats[confidence].correct++;
    } else if (status === 'wrong') {
      stats.wrong++;
      if (stats[confidence]) stats[confidence].wrong++;
    }
    if (stats[confidence]) stats[confidence].total++;
  });

  return stats;
};

// Sub-component for individual session cards
const SessionCard = ({ session, onDelete, onRevise }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const stats = calculateExtendedStats(session);

  const { correctIds, wrongIds, skippedIds } = useMemo(() => {
    const c = [], w = [], s = [];
    if (session.results) {
      Object.entries(session.results).forEach(([qId, status]) => {
         const numId = parseInt(qId);
         if (status === 'correct') c.push(numId);
         else if (status === 'wrong') w.push(numId);
         else s.push(numId);
      });
    }
    return { 
      correctIds: c.sort((a,b) => a - b), 
      wrongIds: w.sort((a,b) => a - b), 
      skippedIds: s.sort((a,b) => a - b) 
    };
  }, [session.results]);

  const getAccuracy = (correct, total) => total === 0 ? 0 : Math.round((correct / total) * 100);

  // --- NEW: Time Stats ---
  const totalDuration = session.stats?.totalDuration || 0;
  const answeredCount = stats.correct + stats.wrong;
  const avgTime = answeredCount > 0 ? totalDuration / answeredCount : 0;
  
  const hasMistakes = stats.wrong > 0 || stats.skipped > 0;
  const canRevise = hasMistakes && session.quizData && onRevise;

  const StatRow = ({ icon: Icon, label, data, colorClass }) => {
    const acc = getAccuracy(data.correct, data.total);
    if (data.total === 0) return null;

    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
        <div className="flex items-center gap-2 w-32">
          <Icon size={16} className={colorClass} />
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex gap-4 text-gray-600">
          <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500"/> {data.correct}</div>
          <div className="flex items-center gap-1"><XCircle size={14} className="text-red-500"/> {data.wrong}</div>
        </div>
        <div className="font-bold text-gray-800 w-12 text-right">{acc}%</div>
      </div>
    );
  };

  const QuestionList = ({ title, ids, colorBg, colorText, colorBorder }) => {
    if (ids.length === 0) return null;
    return (
      <div className={`mt-3 p-3 rounded-lg border ${colorBg} ${colorBorder}`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${colorText}`}>{title} ({ids.length})</h4>
        <div className="flex flex-wrap gap-1.5">
          {ids.map(id => (
            <span key={id} className={`text-xs font-medium px-1.5 py-0.5 rounded bg-white/60 border border-black/5 ${colorText}`}>
              {id}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header Row */}
      <div 
        className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-700">{new Date(session.timestamp).toLocaleDateString()}</span>
            <span className="text-gray-400 text-xs">{new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="flex gap-2">
            {session.tags?.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>)}
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
           {/* --- NEW: Time Badge --- */}
           {totalDuration > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-gray-600 border border-gray-100">
               <Clock size={14} className="text-blue-500"/>
               <span className="text-xs font-mono font-medium">{formatDuration(totalDuration)}</span>
            </div>
           )}

          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase">Score</div>
            <div className="font-bold text-gray-800">
              <span className="text-emerald-600">{stats.correct}</span> / <span className="text-red-500">{stats.wrong}</span>
            </div>
          </div>
          <div className="text-right w-12">
            <div className="text-xs text-gray-400 uppercase">Acc.</div>
            <div className="font-bold text-blue-600">{getAccuracy(stats.correct, stats.correct + stats.wrong)}%</div>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} 
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
             >
              <Trash2 size={18} />
             </button>
             {isExpanded ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
          {canRevise && (
             <div className="flex justify-end mb-3 pt-2">
                <button 
                  onClick={() => onRevise(session)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors border border-blue-200 shadow-sm"
                >
                  <RotateCcw size={16} /> Revise errors and skips
                </button>
             </div>
          )}

          <div className="border-t border-gray-100 pt-4 grid gap-2">
            
            {/* General Stats */}
            <div className="grid grid-cols-3 gap-2 mb-2">
               <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center">
                  <div className="text-xs text-emerald-600 uppercase font-bold">Correct</div>
                  <div className="text-xl font-bold text-emerald-700">{stats.correct}</div>
               </div>
               <div className="bg-red-50 border border-red-100 p-2 rounded-lg text-center">
                  <div className="text-xs text-red-600 uppercase font-bold">Incorrect</div>
                  <div className="text-xl font-bold text-red-700">{stats.wrong}</div>
               </div>
               <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center">
                  <div className="text-xs text-gray-500 uppercase font-bold">Skipped</div>
                  <div className="text-xl font-bold text-gray-600">{stats.skipped}</div>
               </div>
            </div>

            {/* --- NEW: Time Analysis Row --- */}
            {totalDuration > 0 && (
               <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-blue-50/50 border border-blue-100 p-2 rounded-lg flex items-center justify-between px-4">
                     <span className="text-xs text-blue-600 uppercase font-bold flex items-center gap-2"><Timer size={14}/> Total Time</span>
                     <span className="font-mono font-bold text-blue-700">{formatDuration(totalDuration)}</span>
                  </div>
                  <div className="bg-purple-50/50 border border-purple-100 p-2 rounded-lg flex items-center justify-between px-4">
                     <span className="text-xs text-purple-600 uppercase font-bold flex items-center gap-2"><Clock size={14}/> Avg Pace</span>
                     <span className="font-mono font-bold text-purple-700">{formatDuration(avgTime)} / q</span>
                  </div>
               </div>
            )}

            {/* Question Breakdown Lists */}
            <div className="space-y-1 mb-2">
               <div className="text-xs font-semibold text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                 <List size={12} /> Question Breakdown
               </div>
               <QuestionList title="Incorrect Answers" ids={wrongIds} colorBg="bg-red-50" colorBorder="border-red-100" colorText="text-red-600" />
               <QuestionList title="Skipped Questions" ids={skippedIds} colorBg="bg-gray-50" colorBorder="border-gray-200" colorText="text-gray-600" />
               <QuestionList title="Correct Answers" ids={correctIds} colorBg="bg-emerald-50" colorBorder="border-emerald-100" colorText="text-emerald-600" />
            </div>

            {/* Confidence Breakdown */}
            <div className="space-y-1 mt-4">
               <div className="text-xs font-semibold text-gray-400 uppercase mb-1 ml-1">Confidence Analysis</div>
               <StatRow icon={Zap} label="Confident" data={stats.confident} colorClass="text-blue-500" />
               <StatRow icon={HelpCircle} label="Unsure" data={stats.unsure} colorClass="text-amber-500" />
               <StatRow icon={Dices} label="Guessing" data={stats.guessing} colorClass="text-purple-500" />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default function HistoryView({ onRevise }) {
  const [sessions, setSessions] = useState([]);

  const refresh = async () => {
    const all = await db.sessions.orderBy('timestamp').reverse().toArray();
    setSessions(all);
  };

  useEffect(() => { refresh(); }, []);

  const handleExport = async () => {
    const sessions = await db.sessions.toArray();
    const library = JSON.parse(localStorage.getItem('quiz-library') || '[]');
    
    const exportData = {
      version: 2,
      timestamp: new Date().toISOString(),
      sessions,
      library
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Handle New Format (with Library)
        if (data.version === 2 || (data.sessions && data.library)) {
           if (data.sessions && Array.isArray(data.sessions)) {
              await db.sessions.bulkAdd(data.sessions);
           }
           if (data.library && Array.isArray(data.library)) {
              const currentLib = JSON.parse(localStorage.getItem('quiz-library') || '[]');
              // Merge avoiding duplicates by ID
              const newLib = [...currentLib];
              data.library.forEach(item => {
                 if (!newLib.some(existing => existing.id === item.id)) {
                    newLib.push(item);
                 }
              });
              localStorage.setItem('quiz-library', JSON.stringify(newLib));
           }
           alert("Import successful! Sessions and Quizzes restored.");
        } 
        // Handle Legacy Format (Array of Sessions only)
        else if (Array.isArray(data)) {
           await db.sessions.bulkAdd(data);
           alert("Import successful! (Legacy format)");
        } else {
           throw new Error("Unknown format");
        }
        
        refresh();
        // Force reload to update Library in App.jsx (since it doesn't listen to storage events directly)
        window.location.reload(); 

      } catch (err) {
        console.error(err);
        alert("Invalid file format or error importing data.");
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id) => {
    if(confirm("Delete this session?")) {
      await db.sessions.delete(id);
      refresh();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-6 animate-in fade-in">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Logbook</h2>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors">
              <Upload size={16} /> Import
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download size={16} /> Export
            </button>
          </div>
       </div>

       <div className="space-y-3">
         {sessions.map(s => (
           <SessionCard key={s.id} session={s} onDelete={handleDelete} onRevise={onRevise} />
         ))}
         {sessions.length === 0 && <div className="text-center py-10 text-gray-400">No history available.</div>}
       </div>
    </div>
  );
}
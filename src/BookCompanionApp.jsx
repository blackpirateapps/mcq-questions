import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Flag, Trash2, CheckCircle2, 
  List, BookOpen, X, PieChart, Calendar, Save, 
  Download, Upload, Tag, Check, XCircle, MinusCircle,
  BarChart3, History, HelpCircle, Dices, Zap
} from 'lucide-react';

// --- Database Configuration (Local Storage Wrapper) ---
class LocalDB {
  constructor() {
    this.key = 'study-sessions-v2';
  }

  _get() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch {
      return [];
    }
  }

  _set(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  get sessions() {
    return {
      add: async (data) => {
        const list = this._get();
        const newItem = { ...data, id: Date.now() + Math.random() };
        list.push(newItem);
        this._set(list);
        return newItem.id;
      },
      bulkAdd: async (items) => {
        const list = this._get();
        const newItems = items.map(i => ({...i, id: i.id || Date.now() + Math.random()}));
        this._set([...list, ...newItems]);
      },
      delete: async (id) => {
        const list = this._get();
        this._set(list.filter(item => item.id !== id));
      },
      toArray: async () => {
        return this._get();
      },
      orderBy: (field) => {
        return {
          reverse: () => ({
            toArray: async () => {
              const list = this._get();
              return list.sort((a, b) => {
                const valA = new Date(a[field]).getTime();
                const valB = new Date(b[field]).getTime();
                return valB - valA;
              });
            }
          })
        };
      },
      where: (field) => {
        return {
          aboveOrEqual: (value) => ({
            toArray: async () => {
              const list = this._get();
              const compareDate = new Date(value).getTime();
              return list.filter(item => {
                const itemDate = new Date(item[field]).getTime();
                return itemDate >= compareDate;
              });
            }
          })
        };
      }
    };
  }
}

const db = new LocalDB();


// --- Components ---

// 1. Sidebar Navigation
const Sidebar = ({ currentView, onViewChange, isOpen, setIsOpen }) => {
  const navItems = [
    { id: 'quiz', label: 'Current Quiz', icon: BookOpen },
    { id: 'history', label: 'Logbook', icon: History },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-[#f6f7f8] border-r border-gray-200 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0 flex flex-col
    `}>
      <div className="h-14 flex items-center px-4 border-b border-gray-200 bg-[#f6f7f8]/80 backdrop-blur-md">
        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-3 shadow-sm">
           <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
        <h1 className="font-bold text-gray-700 tracking-tight">StudyFocus</h1>
        <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-1 text-gray-500">
          <X size={20} />
        </button>
      </div>

      <div className="p-3 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2 mt-2">Menu</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { onViewChange(item.id); setIsOpen(false); }}
            className={`
              w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentView === item.id 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-600 hover:bg-gray-200/50'}
            `}
          >
            <item.icon size={18} className="mr-3 opacity-70" />
            {item.label}
          </button>
        ))}
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200">
         <div className="text-xs text-gray-400 text-center">v2.2 &bull; Confidence</div>
      </div>
    </div>
  );
};

// 2. Question Card (Quiz Mode) with Confidence Flags
const QuestionCard = ({ 
  qNum, selectedOption, onSelect, isFlagged, onToggleFlag, onClear,
  confidence, onSetConfidence 
}) => {
  const options = ['A', 'B', 'C', 'D'];
  
  // Confidence definitions
  const levels = [
    { id: 'confident', label: 'Confident', icon: Zap, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { id: 'unsure', label: 'Unsure', icon: HelpCircle, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'guessing', label: 'Guessing', icon: Dices, color: 'text-purple-500 bg-purple-50 border-purple-200' }
  ];

  return (
    <div className="w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-start border-b border-gray-50 bg-gray-50/30">
          <div>
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Question</span>
            <h2 className="text-4xl font-bold text-gray-800 mt-1">{qNum}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={onToggleFlag} className={`p-2 rounded-full transition-colors ${isFlagged ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
              <Flag className={isFlagged ? "fill-current" : ""} size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Confidence Selector */}
          <div className="flex gap-2 mb-4 justify-center">
             {levels.map((lvl) => {
               const isActive = confidence === lvl.id;
               return (
                 <button
                   key={lvl.id}
                   onClick={() => onSetConfidence(lvl.id)}
                   className={`
                     flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all
                     ${isActive 
                       ? `${lvl.color} ring-1 ring-inset` 
                       : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                   `}
                 >
                   <lvl.icon size={14} />
                   {lvl.label}
                 </button>
               )
             })}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((opt) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={opt}
                  onClick={() => onSelect(opt)}
                  className={`w-full text-left p-4 rounded-xl flex items-center transition-all duration-200 border ${isSelected ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 border ${isSelected ? 'bg-white text-blue-500 border-white' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{opt}</div>
                  <span className="text-lg font-medium">Option {opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Grading View (Updated to show Confidence)
const GradingView = ({ answers, confidenceMap, totalQuestions, onSaveSession, onCancel }) => {
  const [results, setResults] = useState(() => {
    const initial = {};
    for (let i = 1; i <= totalQuestions; i++) {
      initial[i] = answers[i] ? 'correct' : 'skipped';
    }
    return initial;
  });
  
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleResult = (qNum) => {
    if (!answers[qNum]) return;
    setResults(prev => ({
      ...prev,
      [qNum]: prev[qNum] === 'correct' ? 'wrong' : 'correct'
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    // Calculate Stats
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    
    Object.values(results).forEach(status => {
      if (status === 'correct') correct++;
      else if (status === 'wrong') wrong++;
      else skipped++;
    });

    const sessionData = {
      timestamp: new Date(),
      totalQuestions,
      answers, 
      confidenceMap,
      results,
      tags: tagArray,
      stats: { correct, wrong, skipped, accuracy: correct / (correct + wrong) || 0 }
    };

    await db.sessions.add(sessionData);
    setIsSaving(false);
    onSaveSession();
  };

  return (
    <div className="max-w-4xl mx-auto w-full h-[calc(100vh-4rem)] flex flex-col animate-in fade-in">
      <div className="bg-white rounded-t-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grading Mode</h2>
          <p className="text-gray-500 text-sm">Tap red to mark errors. Icons show confidence.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
              type="text" 
              placeholder="Tags (e.g. Biology, Ch1)" 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
             />
          </div>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2">
            <Save size={18} /> {isSaving ? 'Saving...' : 'Finish'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white border-x border-b border-gray-200 rounded-b-2xl p-4 custom-scrollbar">
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(q => {
            const status = results[q];
            const hasAnswer = !!answers[q];
            const conf = confidenceMap[q] || 'confident';

            return (
              <button
                key={q}
                disabled={!hasAnswer}
                onClick={() => toggleResult(q)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200
                  ${!hasAnswer ? 'bg-gray-100 text-gray-300' : ''}
                  ${status === 'correct' && hasAnswer ? 'bg-emerald-50 border-2 border-emerald-100 text-emerald-600' : ''}
                  ${status === 'wrong' && hasAnswer ? 'bg-red-50 border-2 border-red-100 text-red-600' : ''}
                `}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs font-bold">{q}</span>
                  {hasAnswer && conf === 'unsure' && <HelpCircle size={10} className="text-amber-500" />}
                  {hasAnswer && conf === 'guessing' && <Dices size={10} className="text-purple-500" />}
                </div>

                {hasAnswer && <span className="text-lg font-bold">{answers[q]}</span>}
                
                <div className="absolute -bottom-2">
                   {status === 'correct' && hasAnswer && <div className="bg-emerald-500 rounded-full p-0.5"><Check size={10} className="text-white"/></div>}
                   {status === 'wrong' && hasAnswer && <div className="bg-red-500 rounded-full p-0.5"><X size={10} className="text-white"/></div>}
                   {!hasAnswer && <MinusCircle size={14} className="text-gray-300"/>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-500">
           <div className="flex items-center gap-1"><HelpCircle size={12} className="text-amber-500"/> Unsure</div>
           <div className="flex items-center gap-1"><Dices size={12} className="text-purple-500"/> Guessing</div>
        </div>
      </div>
    </div>
  );
};

// 4. Statistics Dashboard
const StatsView = () => {
  const [timeRange, setTimeRange] = useState('weekly');
  const [stats, setStats] = useState({ correct: 0, wrong: 0, skipped: 0, total: 0 });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === 'daily') startDate.setHours(0,0,0,0);
      if (timeRange === 'weekly') startDate.setDate(now.getDate() - 7);
      if (timeRange === 'monthly') startDate.setMonth(now.getMonth() - 1);

      const loadedSessions = await db.sessions
        .where('timestamp')
        .aboveOrEqual(startDate)
        .toArray();

      setSessions(loadedSessions);

      const agg = loadedSessions.reduce((acc, sess) => ({
        correct: acc.correct + sess.stats.correct,
        wrong: acc.wrong + sess.stats.wrong,
        skipped: acc.skipped + sess.stats.skipped,
        total: acc.total + sess.totalQuestions
      }), { correct: 0, wrong: 0, skipped: 0, total: 0 });

      setStats(agg);
    };
    loadStats();
  }, [timeRange]);

  const accuracy = stats.correct + stats.wrong > 0 
    ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in p-2 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Performance Analytics</h2>
        <div className="flex bg-gray-200 rounded-lg p-1">
          {['daily', 'weekly', 'monthly'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-all ${timeRange === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Accuracy</div>
          <div className="text-3xl font-bold text-gray-800">{accuracy}%</div>
          <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${accuracy}%` }} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Correct</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.correct}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Wrong</div>
          <div className="text-3xl font-bold text-red-500">{stats.wrong}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Sessions</div>
          <div className="text-3xl font-bold text-gray-800">{sessions.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700">Recent Sessions in Range</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Tags</th>
                <th className="px-6 py-3 font-medium text-center">Score</th>
                <th className="px-6 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(sess => (
                <tr key={sess.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{new Date(sess.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {sess.tags.map(t => <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{t}</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center font-mono">
                    <span className="text-emerald-600 font-bold">{sess.stats.correct}</span> / 
                    <span className="text-red-500 font-bold ml-1">{sess.stats.wrong}</span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-400">
                     {Math.round(sess.stats.accuracy * 100)}%
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No sessions found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 5. History / Logbook View
const HistoryView = () => {
  const [sessions, setSessions] = useState([]);

  const refresh = async () => {
    const all = await db.sessions.orderBy('timestamp').reverse().toArray();
    setSessions(all);
  };

  useEffect(() => { refresh(); }, []);

  const handleExport = async () => {
    const allData = await db.sessions.toArray();
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
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
        if (Array.isArray(data)) {
           await db.sessions.bulkAdd(data);
           alert("Import successful!");
           refresh();
        }
      } catch (err) {
        alert("Invalid file format");
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
           <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-700">{new Date(s.timestamp).toLocaleDateString()}</span>
                  <span className="text-gray-400 text-xs">{new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex gap-2">
                  {s.tags?.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase">Accuracy</div>
                    <div className="font-bold text-blue-600">{Math.round(s.stats.accuracy * 100)}%</div>
                 </div>
                 <div className="text-right hidden md:block">
                    <div className="text-xs text-gray-400 uppercase">Questions</div>
                    <div className="font-bold text-gray-700">{s.totalQuestions}</div>
                 </div>
                 <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                   <Trash2 size={18} />
                 </button>
              </div>
           </div>
         ))}
         {sessions.length === 0 && <div className="text-center py-10 text-gray-400">No history available.</div>}
       </div>
    </div>
  );
};

// --- Main App Orchestrator ---

export default function BookCompanionApp() {
  const [view, setView] = useState('quiz'); // 'quiz', 'grading', 'stats', 'history'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Quiz State
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [confidenceMap, setConfidenceMap] = useState({}); // Stores 'confident' | 'unsure' | 'guessing'
  const [flags, setFlags] = useState([]);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Restore active session from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('active-session');
    if (saved) {
      const p = JSON.parse(saved);
      setAnswers(p.answers || {});
      setFlags(p.flags || []);
      setConfidenceMap(p.confidenceMap || {});
      setCurrentQuestion(p.currentQuestion || 1);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('active-session', JSON.stringify({ answers, flags, confidenceMap, currentQuestion }));
  }, [answers, flags, confidenceMap, currentQuestion]);

  // Handlers
  const handleAnswer = (opt) => {
    setAnswers(p => ({...p, [currentQuestion]: opt}));
    if (autoAdvance && currentQuestion < totalQuestions) {
      setTimeout(() => setCurrentQuestion(c => c + 1), 200);
    }
  };

  const handleSetConfidence = (level) => {
    setConfidenceMap(p => ({...p, [currentQuestion]: level}));
  };

  const finishSession = () => {
    setView('grading');
  };

  const handleSessionSaved = () => {
    // Clear local storage and state
    setAnswers({});
    setFlags([]);
    setConfidenceMap({});
    setCurrentQuestion(1);
    localStorage.removeItem('active-session');
    setView('history');
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-gray-900 font-sans overflow-hidden">
      
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden h-14 flex items-center px-4 bg-white border-b border-gray-200 shrink-0">
           <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600"><List size={20}/></button>
           <span className="ml-3 font-semibold text-gray-700 capitalize">{view} Mode</span>
        </div>

        <main className="flex-1 overflow-y-auto relative">
          
          {view === 'quiz' && (
            <div className="flex flex-col h-full">
               <div className="flex-1 flex flex-col justify-center p-4">
                  <QuestionCard 
                    qNum={currentQuestion}
                    selectedOption={answers[currentQuestion]}
                    confidence={confidenceMap[currentQuestion] || 'confident'}
                    isFlagged={flags.includes(currentQuestion)}
                    onSelect={handleAnswer}
                    onSetConfidence={handleSetConfidence}
                    onToggleFlag={() => setFlags(p => p.includes(currentQuestion) ? p.filter(x => x!==currentQuestion) : [...p, currentQuestion])}
                    onClear={() => { const n = {...answers}; delete n[currentQuestion]; setAnswers(n); }}
                  />
                  
                  {/* Controls */}
                  <div className="flex justify-between items-center w-full max-w-xl mx-auto mt-8 px-2">
                      <button onClick={() => setCurrentQuestion(c => Math.max(1, c-1))} disabled={currentQuestion===1} className="p-3 text-gray-400 hover:text-blue-600 disabled:opacity-0"><ChevronLeft size={24} /></button>
                      <div className="text-sm font-medium text-gray-400"> {Object.keys(answers).length} / {totalQuestions} Answered </div>
                      <button onClick={() => setCurrentQuestion(c => Math.min(totalQuestions, c+1))} disabled={currentQuestion===totalQuestions} className="p-3 text-gray-400 hover:text-blue-600 disabled:opacity-0"><ChevronRight size={24} /></button>
                  </div>
               </div>
               
               {/* Bottom Action Bar */}
               <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
                  <button onClick={() => setAutoAdvance(!autoAdvance)} className={`text-xs px-3 py-1.5 rounded-full border ${autoAdvance ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-400'}`}>
                    Auto-Advance: {autoAdvance ? 'ON' : 'OFF'}
                  </button>
                  <button 
                    onClick={finishSession}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all font-medium text-sm"
                  >
                    Finish & Grade
                  </button>
               </div>
            </div>
          )}

          {view === 'grading' && (
            <GradingView 
              answers={answers}
              confidenceMap={confidenceMap}
              totalQuestions={totalQuestions}
              onSaveSession={handleSessionSaved}
              onCancel={() => setView('quiz')}
            />
          )}

          {view === 'stats' && <StatsView />}
          
          {view === 'history' && <HistoryView />}

        </main>
      </div>
    </div>
  );
}
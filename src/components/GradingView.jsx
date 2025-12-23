import React, { useState } from 'react';
import { Tag, Save, Check, X, MinusCircle, HelpCircle, Dices, Clock } from 'lucide-react';
import { db } from '../lib/db';

export default function GradingView({ 
  answers, confidenceMap, totalQuestions, startQuestion = 1, 
  onSaveSession, onCancel, sessionStartTime, timeSpent 
}) {
  const [results, setResults] = useState(() => {
    const initial = {};
    for (let i = 0; i < totalQuestions; i++) {
      const qNum = startQuestion + i;
      initial[qNum] = answers[qNum] ? 'correct' : 'skipped';
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

  const formatTime = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    // Stats
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    
    Object.values(results).forEach(status => {
      if (status === 'correct') correct++;
      else if (status === 'wrong') wrong++;
      else skipped++;
    });

    // Calculate Total Duration
    // Option 1: Wall clock difference (Start to Finish)
    const wallDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
    
    // Option 2: Sum of active time on questions (more accurate if user took breaks?)
    // Let's stick to wall clock for "Session Duration", but we save both.
    const activeDuration = Object.values(timeSpent).reduce((a, b) => a + b, 0);

    const sessionData = {
      timestamp: new Date(),
      totalQuestions,
      answers, 
      confidenceMap,
      results,
      tags: tagArray,
      stats: { 
        correct, 
        wrong, 
        skipped, 
        accuracy: correct / (correct + wrong) || 0,
        totalDuration: wallDuration, // Saving the total session time
        activeDuration: activeDuration 
      },
      timeSpent // Saving per-question breakdown
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
          <div className="flex gap-4 text-sm text-gray-500 mt-1">
             <span>Tap red to mark errors.</span>
             {sessionStartTime && (
                <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 rounded-md">
                   <Clock size={12} /> Time: {formatTime(Date.now() - sessionStartTime)}
                </span>
             )}
          </div>
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
          {Array.from({ length: totalQuestions }, (_, i) => i + startQuestion).map(q => {
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
      </div>
    </div>
  );
}
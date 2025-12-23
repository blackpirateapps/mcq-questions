import React, { useState, useEffect } from 'react';
import { Flag, Zap, HelpCircle, Dices, Clock, Timer } from 'lucide-react';

export default function QuestionCard({ 
  qNum, selectedOption, onSelect, isFlagged, onToggleFlag, onClear,
  confidence, onSetConfidence, initialTime = 0, sessionStartTime
}) {
  const options = ['A', 'B', 'C', 'D'];
  
  const levels = [
    { id: 'confident', label: 'Confident', icon: Zap, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { id: 'unsure', label: 'Unsure', icon: HelpCircle, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { id: 'guessing', label: 'Guessing', icon: Dices, color: 'text-purple-500 bg-purple-50 border-purple-200' }
  ];

  // --- NEW: Local Timer Logic ---
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(0);

  useEffect(() => {
    // Reset local counter when question changes
    setSecondsElapsed(0);

    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
      
      if (sessionStartTime) {
        setTotalSessionSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qNum, sessionStartTime]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate display time for this question (stored time + current elapsed)
  const questionDisplayTime = Math.floor(initialTime / 1000) + secondsElapsed;

  return (
    <div className="w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50 bg-gray-50/30">
          <div>
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Question</span>
            <h2 className="text-3xl font-bold text-gray-800 leading-none mt-1">{qNum}</h2>
          </div>
          <div className="flex items-center gap-3">
             
             {/* --- NEW: Timer Display --- */}
             <div className="flex flex-col items-end mr-2">
                <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100" title="Time on this question">
                  <Clock size={14} />
                  {formatTime(questionDisplayTime)}
                </div>
                {sessionStartTime && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 mt-1" title="Total session time">
                    <Timer size={10} />
                    {formatTime(totalSessionSeconds)}
                  </div>
                )}
             </div>

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
}
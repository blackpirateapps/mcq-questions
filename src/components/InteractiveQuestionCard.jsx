import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Flag } from 'lucide-react';

export default function InteractiveQuestionCard({ 
  data, qNum, totalQuestions, onAnswer, onNext, isLast,
  onToggleFlag, isFlagged
}) {
  const [selected, setSelected] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelected(null);
    setIsRevealed(false);
  }, [data]);

  const handleSelect = (opt) => {
    if (isRevealed) return;
    setSelected(opt);
    setIsRevealed(true);
    
    const isCorrect = opt === data.answer;
    onAnswer(opt, isCorrect);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-start">
          <div className="flex items-center gap-3">
             <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md">Q{qNum}</span>
             <span className="text-gray-400 text-sm font-medium">of {totalQuestions}</span>
          </div>
          <button onClick={onToggleFlag} className={`p-2 rounded-full transition-colors ${isFlagged ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
             <Flag className={isFlagged ? "fill-current" : ""} size={18} />
          </button>
        </div>

        {/* Question Text */}
        <div className="p-6 md:p-8">
           <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed mb-8">
             {data.question}
           </h2>

           <div className="space-y-3">
             {data.options.map((opt, idx) => {
               // Determine styling state
               let stateStyle = "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700";
               let icon = null;

               if (isRevealed) {
                 if (opt === data.answer) {
                   // Correct Answer (Always highlight green)
                   stateStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500";
                   icon = <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />;
                 } else if (opt === selected) {
                   // Wrong Selection (Highlight red)
                   stateStyle = "bg-red-50 border-red-500 text-red-700 shadow-sm ring-1 ring-red-500";
                   icon = <XCircle className="text-red-500 shrink-0" size={20} />;
                 } else {
                   // Other incorrect options
                   stateStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                 }
               } else if (selected === opt) {
                 // Selected but not yet revealed (shouldn't happen with instant reveal, but good for transition)
                 stateStyle = "bg-indigo-50 border-indigo-500 text-indigo-700";
               }

               return (
                 <button
                   key={idx}
                   onClick={() => handleSelect(opt)}
                   disabled={isRevealed}
                   className={`
                     w-full text-left p-4 rounded-xl flex items-center justify-between border-2 transition-all duration-200 group
                     ${stateStyle}
                   `}
                 >
                   <div className="flex items-center gap-4">
                     <div className={`
                       w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors
                       ${isRevealed && opt === data.answer ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                       ${isRevealed && opt === selected && opt !== data.answer ? 'bg-red-500 border-red-500 text-white' : ''}
                       ${!isRevealed ? 'bg-gray-100 text-gray-500 border-gray-200 group-hover:border-gray-300' : ''}
                     `}>
                       {String.fromCharCode(65 + idx)}
                     </div>
                     <span className="text-lg font-medium">{opt}</span>
                   </div>
                   {icon}
                 </button>
               );
             })}
           </div>
        </div>

        {/* Footer Actions (Next Button) */}
        {isRevealed && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end animate-in slide-in-from-bottom-2">
             <button 
               onClick={onNext}
               className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
             >
               {isLast ? "Finish Quiz" : "Next Question"}
               <ArrowRight size={18} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
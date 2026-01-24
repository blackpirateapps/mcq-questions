import React from 'react';
import { BookOpen, History, BarChart3, CheckCircle2, X, FileJson } from 'lucide-react';

export default function Sidebar({ 
  currentView, onViewChange, isOpen, setIsOpen,
  totalQuestions, startQuestion = 1, currentQuestion, answers, flags, visited, onJump
}) {
  const navItems = [
    { id: 'quiz', label: 'Book Mode', icon: BookOpen },
    { id: 'upload', label: 'Quiz Mode', icon: FileJson },
    { id: 'history', label: 'Logbook', icon: History },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-72 bg-[#f6f7f8] border-r border-gray-200 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0 flex flex-col
    `}>
      <div className="h-14 flex items-center px-4 border-b border-gray-200 bg-[#f6f7f8]/80 backdrop-blur-md shrink-0">
        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-3 shadow-sm">
           <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
        <h1 className="font-bold text-gray-700 tracking-tight">StudyFocus</h1>
        <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-1 text-gray-500">
          <X size={20} />
        </button>
      </div>

      <div className="p-3 space-y-1 shrink-0">
        <div className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2 mt-2">Menu</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { onViewChange(item.id); if (window.innerWidth < 768) setIsOpen(false); }}
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
      
      {/* Question Grid (Visible only in Quiz mode) */}
      {currentView === 'quiz' && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-t border-gray-200 mt-2">
           <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10 flex justify-between items-center">
             <span>Navigator</span>
             <span className="text-[10px] font-normal normal-case opacity-70">
               {Object.keys(answers).length}/{totalQuestions}
             </span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
             <div className="grid grid-cols-5 gap-2">
               {Array.from({ length: totalQuestions }, (_, i) => i + startQuestion).map((q) => {
                 const isCurrent = currentQuestion === q;
                 const isAnswered = answers[q] !== undefined;
                 const isFlagged = flags.includes(q);
                 const isVisited = visited.has(q);

                 // --- Style Logic ---
                 let baseStyle = "bg-transparent border-transparent text-gray-300 hover:bg-gray-100";
                 
                 // Visited but Unanswered
                 if (isVisited && !isAnswered && !isFlagged) {
                   baseStyle = "bg-gray-200 text-gray-600 border-transparent";
                 }
                 // Answered
                 else if (isAnswered) {
                   baseStyle = "bg-blue-500 text-white border-blue-600 shadow-sm";
                 }

                 // Flagged Overrides
                 if (isFlagged) {
                   if (isAnswered) {
                     baseStyle = "bg-blue-600 text-white border-orange-400 ring-1 ring-orange-400";
                   } else {
                     baseStyle = "bg-orange-50 text-orange-600 border-orange-200 ring-1 ring-orange-200";
                   }
                 }

                 return (
                   <button
                     key={q}
                     onClick={() => { onJump(q); if (window.innerWidth < 768) setIsOpen(false); }}
                     className={`
                       h-8 w-full rounded-md text-xs font-bold transition-all duration-200 relative border flex items-center justify-center
                       ${baseStyle}
                       ${isCurrent ? 'ring-2 ring-gray-800 ring-offset-1 z-10 scale-110' : ''}
                     `}
                   >
                     {q}
                     {/* Mini Indicator dots */}
                     {isFlagged && isAnswered && (
                       <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full border border-blue-600" />
                     )}
                   </button>
                 );
               })}
             </div>
             
             {/* Legend */}
             <div className="mt-6 space-y-2 px-1">
               <div className="flex items-center gap-2 text-[10px] text-gray-500">
                 <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Answered
               </div>
               <div className="flex items-center gap-2 text-[10px] text-gray-500">
                 <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded-sm"></div> Marked
               </div>
               <div className="flex items-center gap-2 text-[10px] text-gray-500">
                 <div className="w-3 h-3 bg-gray-200 rounded-sm"></div> Visited
               </div>
             </div>
           </div>
        </div>
      )}

      <div className="mt-auto p-4 border-t border-gray-200 shrink-0">
         <div className="text-xs text-gray-400 text-center">v2.3 &bull; Navigator</div>
      </div>
    </div>
  );
}
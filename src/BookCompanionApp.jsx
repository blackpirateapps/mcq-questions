import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Trash2, 
  CheckCircle2, 
  List, 
  BookOpen,
  X
} from 'lucide-react';

// --- Components ---

// 1. The Sidebar Navigation (Things 3 Style)
const Sidebar = ({ 
  totalQuestions, 
  currentQuestion, 
  answers, 
  flags, 
  onJump, 
  isOpen, 
  setIsOpen 
}) => {
  const questions = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-[#f6f7f8] border-r border-gray-200 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      <div className="flex flex-col h-full">
        <div className="h-14 flex items-center px-4 border-b border-gray-200 bg-[#f6f7f8]/80 backdrop-blur-md sticky top-0">
          <BookOpen className="w-5 h-5 text-gray-500 mr-2" />
          <h1 className="font-bold text-gray-700 tracking-tight">Question Log</h1>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden ml-auto p-1 text-gray-500 hover:bg-gray-200 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q) => {
              const isAnswered = answers[q] !== undefined;
              const isFlagged = flags.includes(q);
              const isCurrent = currentQuestion === q;

              return (
                <button
                  key={q}
                  onClick={() => {
                    onJump(q);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`
                    h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all relative
                    ${isCurrent 
                      ? 'bg-white shadow-md text-blue-600 ring-2 ring-blue-500/20' 
                      : 'bg-transparent hover:bg-black/5 text-gray-600'}
                    ${isAnswered && !isCurrent ? 'text-gray-900 font-bold bg-gray-200/50' : ''}
                  `}
                >
                  {q}
                  {isFlagged && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  )}
                  {isAnswered && !isFlagged && (
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. The Main Question Card
const QuestionCard = ({ 
  qNum, 
  selectedOption, 
  onSelect, 
  isFlagged, 
  onToggleFlag,
  onClear
}) => {
  const options = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-6 flex justify-between items-start border-b border-gray-50">
          <div>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Current Question</span>
            <h2 className="text-4xl font-bold text-gray-800 mt-1">{qNum}</h2>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onToggleFlag}
              className={`p-2 rounded-full transition-colors ${isFlagged ? 'bg-orange-100 text-orange-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
              title="Flag for review (F)"
            >
              <Flag className={isFlagged ? "fill-current" : ""} size={20} />
            </button>
            {selectedOption && (
              <button 
                onClick={onClear}
                className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Clear answer"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          {options.map((opt) => {
            const isSelected = selectedOption === opt;
            return (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                className={`
                  w-full text-left p-4 rounded-xl flex items-center group transition-all duration-200
                  ${isSelected 
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.01]' 
                    : 'bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 hover:border-gray-200'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 border transition-colors
                  ${isSelected ? 'bg-white text-blue-500 border-white' : 'bg-gray-100 text-gray-500 border-gray-200 group-hover:border-gray-300'}
                `}>
                  {opt}
                </div>
                <span className="text-lg font-medium">Option {opt}</span>
                {isSelected && <CheckCircle2 className="ml-auto w-6 h-6 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-400 text-sm">
        Use keyboard <b>1-4</b> or <b>A-D</b> to select
      </div>
    </div>
  );
};

// 3. Summary View (Logbook)
const SummaryView = ({ answers, flags, totalQuestions, onClose, onClearAll }) => {
  const [filter, setFilter] = useState('all'); // all, answered, flagged
  const data = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  const filteredData = data.filter(q => {
    if (filter === 'answered') return answers[q];
    if (filter === 'flagged') return flags.includes(q);
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col h-[80vh]">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Session Summary</h2>
            <p className="text-gray-500 text-sm mt-1">
              {Object.keys(answers).length} answered &bull; {flags.length} flagged
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={onClearAll}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              Reset Session
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all"
            >
              Resume Quiz
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-1 p-2 bg-gray-50 border-b border-gray-100">
           {['all', 'answered', 'flagged'].map(f => (
             <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
             >
               {f}
             </button>
           ))}
        </div>

        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Q#</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Answer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map(q => {
                const ans = answers[q];
                const isFlagged = flags.includes(q);
                return (
                  <tr key={q} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-6 font-medium text-gray-700">{q}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-2">
                        {isFlagged && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">Flagged</span>}
                        {!ans && !isFlagged && <span className="text-gray-300 text-sm">-</span>}
                      </div>
                    </td>
                    <td className={`py-3 px-6 font-bold font-mono ${ans ? 'text-blue-600' : 'text-gray-300'}`}>
                      {ans || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredData.length === 0 && (
             <div className="p-12 text-center text-gray-400">No questions found for this filter.</div>
          )}
        </div>

      </div>
    </div>
  );
};

// --- Main App ---

export default function BookCompanionApp() {
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState([]);
  const [view, setView] = useState('quiz'); // 'quiz' | 'summary'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Persistence
  useEffect(() => {
    const savedData = localStorage.getItem('mcq-session-things3-v1');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAnswers(parsed.answers || {});
        setFlags(parsed.flags || []);
        setCurrentQuestion(parsed.currentQuestion || 1);
        setTotalQuestions(parsed.totalQuestions || 100);
        setAutoAdvance(parsed.autoAdvance ?? true);
      } catch (e) {
        console.error("Failed to load session", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mcq-session-things3-v1', JSON.stringify({
      answers,
      flags,
      currentQuestion,
      totalQuestions,
      autoAdvance
    }));
  }, [answers, flags, currentQuestion, totalQuestions, autoAdvance]);

  // Handlers
  const handleAnswer = (option) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: option }));
    if (autoAdvance && currentQuestion < totalQuestions) {
      setTimeout(() => setCurrentQuestion(c => c + 1), 250); 
    }
  };

  const handleToggleFlag = () => {
    setFlags(prev => {
      if (prev.includes(currentQuestion)) {
        return prev.filter(q => q !== currentQuestion);
      }
      return [...prev, currentQuestion];
    });
  };

  const handleClearAnswer = () => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentQuestion];
      return next;
    });
  };

  const resetSession = () => {
    if (window.confirm("Are you sure you want to clear all progress?")) {
      setAnswers({});
      setFlags([]);
      setCurrentQuestion(1);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (view !== 'quiz') return;

      if (e.key === 'ArrowRight') {
        if (currentQuestion < totalQuestions) setCurrentQuestion(c => c + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentQuestion > 1) setCurrentQuestion(c => c - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFlag();
      } else if (['1', 'a', 'A'].includes(e.key)) handleAnswer('A');
      else if (['2', 'b', 'B'].includes(e.key)) handleAnswer('B');
      else if (['3', 'c', 'C'].includes(e.key)) handleAnswer('C');
      else if (['4', 'd', 'D'].includes(e.key)) handleAnswer('D');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, totalQuestions, view, autoAdvance]);

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-gray-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        totalQuestions={totalQuestions}
        currentQuestion={currentQuestion}
        answers={answers}
        flags={flags}
        onJump={(q) => {
          setCurrentQuestion(q);
          setView('quiz');
        }}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Navigation Bar */}
        <header className="h-14 flex items-center justify-between px-4 bg-[#f3f4f6] shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <List size={20} />
            </button>
            <div className="ml-2 md:ml-4 text-sm font-medium text-gray-500">
               {Object.keys(answers).length} of {totalQuestions} answered
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {view === 'quiz' && (
              <>
                 <button 
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={`text-xs px-2 py-1 rounded border ${autoAdvance ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-transparent text-gray-400 border-gray-300'}`}
                  title="Auto-advance after selection"
                >
                  Auto-Advance: {autoAdvance ? 'ON' : 'OFF'}
                </button>
                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                <button 
                  onClick={() => setView('summary')}
                  className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                  title="View Summary"
                >
                  <List size={20} />
                </button>
              </>
            )}
            {view === 'summary' && (
               <button 
                onClick={() => setView('quiz')}
                className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all font-medium text-sm"
              >
                Back to Quiz
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center relative">
          
          {view === 'quiz' ? (
            <div className="w-full h-full flex flex-col justify-center">
               <QuestionCard 
                  qNum={currentQuestion}
                  selectedOption={answers[currentQuestion]}
                  isFlagged={flags.includes(currentQuestion)}
                  onSelect={handleAnswer}
                  onToggleFlag={handleToggleFlag}
                  onClear={handleClearAnswer}
               />
               
               {/* Floating Nav Controls */}
               <div className="flex justify-between items-center w-full max-w-2xl mx-auto mt-8 px-2">
                  <button 
                    onClick={() => currentQuestion > 1 && setCurrentQuestion(c => c - 1)}
                    disabled={currentQuestion === 1}
                    className="flex items-center px-4 py-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={20} className="mr-1" /> Prev
                  </button>

                  <div className="text-sm font-medium text-gray-400">
                    Question {currentQuestion} / {totalQuestions}
                  </div>

                  <button 
                     onClick={() => currentQuestion < totalQuestions && setCurrentQuestion(c => c + 1)}
                     disabled={currentQuestion === totalQuestions}
                     className="flex items-center px-4 py-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
                  >
                    Next <ChevronRight size={20} className="ml-1" />
                  </button>
               </div>
            </div>
          ) : (
            <SummaryView 
              answers={answers}
              flags={flags}
              totalQuestions={totalQuestions}
              onClose={() => setView('quiz')}
              onClearAll={resetSession}
            />
          )}

        </main>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 w-full shrink-0">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${(Object.keys(answers).length / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import QuestionCard from './components/QuestionCard';
import GradingView from './components/GradingView';
import StatsView from './components/StatsView';
import HistoryView from './components/HistoryView';
import SetupView from './components/SetupView';

export default function BookCompanionApp() {
  const [view, setView] = useState('quiz'); // 'quiz', 'grading', 'stats', 'history'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Quiz State
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [startQuestion, setStartQuestion] = useState(1); // New State
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [confidenceMap, setConfidenceMap] = useState({}); 
  const [flags, setFlags] = useState([]);
  const [visited, setVisited] = useState(new Set([1])); 
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
      setStartQuestion(p.startQuestion || 1); // Restore startQuestion
      if (p.visited) setVisited(new Set(p.visited));
      if (p.totalQuestions) setTotalQuestions(p.totalQuestions);
      setIsSessionActive(true); 
    }
  }, []);

  useEffect(() => {
    if (isSessionActive) {
      localStorage.setItem('active-session', JSON.stringify({ 
        answers, flags, confidenceMap, currentQuestion, visited: Array.from(visited), totalQuestions, startQuestion 
      }));
    }
  }, [answers, flags, confidenceMap, currentQuestion, visited, totalQuestions, startQuestion, isSessionActive]);

  // Track visits
  useEffect(() => {
    if (isSessionActive) {
      setVisited(prev => {
        const next = new Set(prev);
        next.add(currentQuestion);
        return next;
      });
    }
  }, [currentQuestion, isSessionActive]);

  // Handlers
  const startNewSession = (count, startNum = 1) => {
    setTotalQuestions(count);
    setStartQuestion(startNum);
    setCurrentQuestion(startNum);
    setAnswers({});
    setConfidenceMap({});
    setFlags([]);
    setVisited(new Set([startNum]));
    setIsSessionActive(true);
    setView('quiz');
  };

  // Helper for end question
  const endQuestion = startQuestion + totalQuestions - 1;

  const handleAnswer = (opt) => {
    setAnswers(p => ({...p, [currentQuestion]: opt}));
    if (autoAdvance && currentQuestion < endQuestion) {
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
    localStorage.removeItem('active-session');
    setAnswers({});
    setFlags([]);
    setConfidenceMap({});
    setStartQuestion(1);
    setCurrentQuestion(1);
    setVisited(new Set([1]));
    setIsSessionActive(false); 
    setView('history');
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-gray-900 font-sans overflow-hidden">
      
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        totalQuestions={totalQuestions}
        startQuestion={startQuestion}
        currentQuestion={currentQuestion}
        answers={answers}
        flags={flags}
        visited={visited}
        onJump={setCurrentQuestion}
        isSessionActive={isSessionActive}
      />

      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden h-14 flex items-center px-4 bg-white border-b border-gray-200 shrink-0">
           <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600"><List size={20}/></button>
           <span className="ml-3 font-semibold text-gray-700 capitalize">{view === 'quiz' && !isSessionActive ? 'New Session' : `${view} Mode`}</span>
        </div>

        <main className="flex-1 overflow-y-auto relative">
          
          {view === 'quiz' && (
            !isSessionActive ? (
              <SetupView onStart={startNewSession} />
            ) : (
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
                        <button onClick={() => setCurrentQuestion(c => Math.max(startQuestion, c-1))} disabled={currentQuestion===startQuestion} className="p-3 text-gray-400 hover:text-blue-600 disabled:opacity-0"><ChevronLeft size={24} /></button>
                        <div className="text-sm font-medium text-gray-400"> {Object.keys(answers).length} / {totalQuestions} Answered </div>
                        <button onClick={() => setCurrentQuestion(c => Math.min(endQuestion, c+1))} disabled={currentQuestion===endQuestion} className="p-3 text-gray-400 hover:text-blue-600 disabled:opacity-0"><ChevronRight size={24} /></button>
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
            )
          )}

          {view === 'grading' && (
            <GradingView 
              answers={answers}
              confidenceMap={confidenceMap}
              totalQuestions={totalQuestions}
              startQuestion={startQuestion}
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
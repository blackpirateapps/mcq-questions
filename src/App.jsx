import React, { useState, useEffect, useRef } from 'react';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import QuestionCard from './components/QuestionCard';
import InteractiveQuestionCard from './components/InteractiveQuestionCard';
import GradingView from './components/GradingView';
import StatsView from './components/StatsView';
import HistoryView from './components/HistoryView';
import SetupView from './components/SetupView';
import QuizUploadView from './components/QuizUploadView';

export default function BookCompanionApp() {
  const [view, setView] = useState('quiz'); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Quiz State (Common)
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [startQuestion, setStartQuestion] = useState(1); 
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [confidenceMap, setConfidenceMap] = useState({}); 
  const [flags, setFlags] = useState([]);
  const [visited, setVisited] = useState(new Set([1])); 
  const [autoAdvance, setAutoAdvance] = useState(true);
  
  // Interactive Quiz Specific
  const [quizMode, setQuizMode] = useState('book'); // 'book' | 'interactive'
  const [quizData, setQuizData] = useState([]);
  const [quizResults, setQuizResults] = useState({}); // { qNum: 'correct' | 'wrong' }
  const [savedQuiz, setSavedQuiz] = useState(null);

  // Time Tracking State
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState({}); // Map of qId -> ms
  
  // Refs for precise active time tracking
  const currentQStartTimeRef = useRef(null);
  const currentQAccumulatedRef = useRef(0);

  // Restore active session
  useEffect(() => {
    // Restore Saved Quiz
    const storedQuiz = localStorage.getItem('saved-quiz');
    if (storedQuiz) {
      try {
        setSavedQuiz(JSON.parse(storedQuiz));
      } catch (e) { console.error("Failed to load saved quiz", e); }
    }

    const saved = localStorage.getItem('active-session');
    if (saved) {
      const p = JSON.parse(saved);
      // Restore common state
      setAnswers(p.answers || {});
      setFlags(p.flags || []);
      setConfidenceMap(p.confidenceMap || {});
      setCurrentQuestion(p.currentQuestion || 1);
      setStartQuestion(p.startQuestion || 1); 
      if (p.visited) setVisited(new Set(p.visited));
      if (p.totalQuestions) setTotalQuestions(p.totalQuestions);
      
      // Restore Timing
      if (p.sessionStartTime) setSessionStartTime(p.sessionStartTime);
      if (p.timeSpent) setTimeSpent(p.timeSpent);
      
      // Restore Mode
      if (p.quizMode) setQuizMode(p.quizMode);
      if (p.quizData) setQuizData(p.quizData);
      if (p.quizResults) setQuizResults(p.quizResults);

      setIsSessionActive(true); 
    }
  }, []);

  // Save active session
  useEffect(() => {
    if (isSessionActive) {
      localStorage.setItem('active-session', JSON.stringify({ 
        answers, flags, confidenceMap, currentQuestion, 
        visited: Array.from(visited), totalQuestions, startQuestion,
        sessionStartTime, timeSpent,
        quizMode, quizData, quizResults
      }));
    }
  }, [answers, flags, confidenceMap, currentQuestion, visited, totalQuestions, startQuestion, isSessionActive, sessionStartTime, timeSpent, quizMode, quizData, quizResults]);

  // Visit tracking
  useEffect(() => {
    if (isSessionActive) {
      setVisited(prev => {
        const next = new Set(prev);
        next.add(currentQuestion);
        return next;
      });
    }
  }, [currentQuestion, isSessionActive]);

  // --- NEW: Active Time Tracking Logic ---
  useEffect(() => {
    if (!isSessionActive) return;

    // 1. Initialize for new question
    currentQAccumulatedRef.current = 0;
    
    // Start clock only if currently visible
    if (!document.hidden) {
       currentQStartTimeRef.current = Date.now();
    } else {
       currentQStartTimeRef.current = null;
    }

    // 2. Define Visibility Listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // PAUSE: Calculate elapsed and add to accumulated
        if (currentQStartTimeRef.current !== null) {
          const now = Date.now();
          currentQAccumulatedRef.current += (now - currentQStartTimeRef.current);
          currentQStartTimeRef.current = null;
        }
      } else {
        // RESUME: Start clock
        currentQStartTimeRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Cleanup: Remove listener and Save Data
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      // Calculate final elapsed for this segment
      let elapsed = currentQAccumulatedRef.current;
      if (currentQStartTimeRef.current !== null) {
        elapsed += (Date.now() - currentQStartTimeRef.current);
      }
      
      // Update State
      if (elapsed > 0) {
        setTimeSpent(prev => ({
          ...prev,
          [currentQuestion]: (prev[currentQuestion] || 0) + elapsed
        }));
      }
      
      // Reset Refs
      currentQStartTimeRef.current = null;
      currentQAccumulatedRef.current = 0;
    };
  }, [currentQuestion, isSessionActive]);


  // Handlers
  const startNewSession = (count, startNum = 1) => {
    setQuizMode('book');
    setTotalQuestions(count);
    setStartQuestion(startNum);
    setCurrentQuestion(startNum);
    setAnswers({});
    setConfidenceMap({});
    setFlags([]);
    setVisited(new Set([startNum]));
    setQuizData([]);
    setQuizResults({});
    
    // Reset Timer
    setSessionStartTime(Date.now());
    setTimeSpent({});
    
    setIsSessionActive(true);
    setView('quiz');
  };

  const startInteractiveSession = (data) => {
    // Persist Quiz
    localStorage.setItem('saved-quiz', JSON.stringify(data));
    setSavedQuiz(data);

    setQuizMode('interactive');
    setQuizData(data);
    setTotalQuestions(data.length);
    setStartQuestion(1);
    setCurrentQuestion(1);
    setAnswers({});
    setConfidenceMap({});
    setFlags([]);
    setVisited(new Set([1]));
    setQuizResults({});

    // Reset Timer
    setSessionStartTime(Date.now());
    setTimeSpent({});

    setIsSessionActive(true);
    setView('quiz');
  };

  const endQuestion = startQuestion + totalQuestions - 1;

  const handleAnswer = (opt) => {
    setAnswers(p => ({...p, [currentQuestion]: opt}));
    if (quizMode === 'book' && autoAdvance && currentQuestion < endQuestion) {
      setTimeout(() => setCurrentQuestion(c => c + 1), 200);
    }
  };

  const handleInteractiveAnswer = (opt, isCorrect) => {
    setAnswers(p => ({...p, [currentQuestion]: opt}));
    setQuizResults(p => ({...p, [currentQuestion]: isCorrect ? 'correct' : 'wrong'}));
    // Note: We don't auto-advance in interactive mode to let user see the explanation/result
  };

  const handleSetConfidence = (level) => {
    setConfidenceMap(p => ({...p, [currentQuestion]: level}));
  };

  const finishSession = () => {
    setIsSessionActive(false); 
    setView('grading');
  };

  const cancelSession = () => {
    if (window.confirm("Are you sure you want to cancel this session? All progress will be lost.")) {
      setAnswers({});
      setFlags([]);
      setConfidenceMap({});
      setStartQuestion(1);
      setCurrentQuestion(1);
      setVisited(new Set([1]));
      setSessionStartTime(null);
      setTimeSpent({});
      setQuizData([]);
      setQuizResults({});
      setQuizMode('book');
      setIsSessionActive(false);
      localStorage.removeItem('active-session');
      setView('quiz');
    }
  };

  const handleSessionSaved = () => {
    localStorage.removeItem('active-session');
    setAnswers({});
    setFlags([]);
    setConfidenceMap({});
    setStartQuestion(1);
    setCurrentQuestion(1);
    setVisited(new Set([1]));
    setSessionStartTime(null);
    setTimeSpent({});
    setQuizData([]);
    setQuizResults({});
    setQuizMode('book');
    setIsSessionActive(false); 
    setView('history');
  };

  // Calculate Total Active Time so far for display
  const totalActiveTime = Object.values(timeSpent).reduce((a, b) => a + b, 0);

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
        <div className="md:hidden h-14 flex items-center px-4 bg-white border-b border-gray-200 shrink-0">
           <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600"><List size={20}/></button>
           <span className="ml-3 font-semibold text-gray-700 capitalize">
             {view === 'quiz' && !isSessionActive 
               ? 'New Session' 
               : (view === 'upload' ? 'Upload Quiz' : `${view} Mode`)
             }
           </span>
        </div>

        <main className="flex-1 overflow-y-auto relative">
          
          {view === 'upload' && (
             <QuizUploadView onUpload={startInteractiveSession} savedQuiz={savedQuiz} />
          )}

          {view === 'quiz' && (
            !isSessionActive ? (
              <SetupView onStart={startNewSession} />
            ) : (
              <div className="flex flex-col h-full">
                 <div className="flex-1 flex flex-col justify-center p-4">
                    {quizMode === 'book' ? (
                      <QuestionCard 
                        qNum={currentQuestion}
                        selectedOption={answers[currentQuestion]}
                        confidence={confidenceMap[currentQuestion] || 'confident'}
                        isFlagged={flags.includes(currentQuestion)}
                        onSelect={handleAnswer}
                        onSetConfidence={handleSetConfidence}
                        onToggleFlag={() => setFlags(p => p.includes(currentQuestion) ? p.filter(x => x!==currentQuestion) : [...p, currentQuestion])}
                        onClear={() => { const n = {...answers}; delete n[currentQuestion]; setAnswers(n); }}
                        // Time Props
                        initialTime={timeSpent[currentQuestion] || 0}
                        totalActiveTime={totalActiveTime}
                      />
                    ) : (
                      <InteractiveQuestionCard
                        data={quizData[currentQuestion - 1]} // Data is 0-indexed, currentQuestion is 1-indexed
                        qNum={currentQuestion}
                        totalQuestions={totalQuestions}
                        onAnswer={handleInteractiveAnswer}
                        isLast={currentQuestion === endQuestion}
                        onNext={() => currentQuestion < endQuestion ? setCurrentQuestion(c => c + 1) : finishSession()}
                        isFlagged={flags.includes(currentQuestion)}
                        onToggleFlag={() => setFlags(p => p.includes(currentQuestion) ? p.filter(x => x!==currentQuestion) : [...p, currentQuestion])}
                      />
                    )}
                    
                    {quizMode === 'book' && (
                      <div className="flex justify-between items-center w-full max-w-xl mx-auto mt-8 px-2">
                          <button onClick={() => setCurrentQuestion(c => Math.max(startQuestion, c-1))} disabled={currentQuestion===startQuestion} className="p-3 text-gray-400 hover:text-blue-600 disabled:opacity-0"><ChevronLeft size={24} /></button>
                          <div className="text-sm font-medium text-gray-400"> {Object.keys(answers).length} / {totalQuestions} Answered </div>
                          <button onClick={() => setCurrentQuestion(c => Math.min(endQuestion, c+1))} disabled={currentQuestion===endQuestion} className="p-3 text-gray-400 hover:text-blue-600 disabled:opacity-0"><ChevronRight size={24} /></button>
                      </div>
                    )}
                 </div>
                 
                 <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center shrink-0 gap-4">
                    <button 
                      onClick={cancelSession}
                      className="text-red-500 hover:text-red-600 font-medium text-sm px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>

                    {quizMode === 'book' && (
                      <button onClick={() => setAutoAdvance(!autoAdvance)} className={`text-xs px-3 py-1.5 rounded-full border ${autoAdvance ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-400'}`}>
                        Auto-Advance: {autoAdvance ? 'ON' : 'OFF'}
                      </button>
                    )}
                    
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
              onDiscard={cancelSession}
              sessionStartTime={sessionStartTime}
              timeSpent={timeSpent}
              initialResults={quizMode === 'interactive' ? quizResults : null}
            />
          )}

          {view === 'stats' && <StatsView />}
          
          {view === 'history' && <HistoryView />}

        </main>
      </div>
    </div>
  );
}
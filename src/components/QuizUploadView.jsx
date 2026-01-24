import React, { useState } from 'react';
import { Upload, FileJson, AlertCircle, Play, Trash2, Book, RotateCcw } from 'lucide-react';

export default function QuizUploadView({ onUpload, quizLibrary = [], onSelect, onDelete, onRetryMistakes }) {
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    setError(null);
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError("Please upload a .json file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Basic Validation
        if (!Array.isArray(json)) {
          throw new Error("Root must be an array of questions");
        }
        
        if (json.length === 0) {
          throw new Error("File contains no questions");
        }

        const valid = json.every(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.answer
        );

        if (!valid) {
          throw new Error("Invalid format. Each question must have 'question', 'options' (array), and 'answer'.");
        }

        onUpload(json, file.name);

      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col items-center justify-start h-full p-6 animate-in fade-in zoom-in duration-300 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-2xl space-y-8">
        
        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileJson size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Mode</h2>
          <p className="text-gray-500 mb-8">Upload a JSON file to add a new section.</p>
          
          <div 
            className={`
              border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer
              ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('quiz-upload').click()}
          >
            <input 
              type="file" 
              id="quiz-upload" 
              className="hidden" 
              accept=".json"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <Upload className="mx-auto text-gray-400 mb-4" size={40} />
            <p className="font-medium text-gray-700">Click to upload or drag & drop</p>
            <p className="text-sm text-gray-400 mt-2">Format: [{"{"} question, options[], answer {"}"}]</p>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3 text-left">
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Library Section */}
        {quizLibrary.length > 0 && (
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-700 px-1">Your Library ({quizLibrary.length})</h3>
              <div className="grid gap-4">
                 {quizLibrary.map((quiz) => (
                    <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                             <Book size={20} />
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-800 line-clamp-1">{quiz.title}</h4>
                             <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                                <span>{quiz.questions.length} Questions</span>
                                <span>&bull;</span>
                                <span>Added {new Date(quiz.addedAt).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onSelect(quiz.questions, quiz.id, quiz.title)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                          >
                            <Play size={14} className="fill-current" /> Start
                          </button>
                          
                          <button 
                            onClick={() => onRetryMistakes(quiz.id)}
                            className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                            title="Retry Wrong/Skipped"
                          >
                            <RotateCcw size={14} /> Mistakes
                          </button>

                          <button 
                            onClick={() => onDelete(quiz.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete Quiz"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
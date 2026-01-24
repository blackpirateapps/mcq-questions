import React, { useState } from 'react';
import { Upload, FileJson, AlertCircle, Play, History } from 'lucide-react';

export default function QuizUploadView({ onUpload, savedQuiz }) {
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

        onUpload(json);

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
    <div className="flex flex-col items-center justify-center h-full p-6 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Saved Quiz Option */}
        {savedQuiz && (
           <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <History size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-800">Resume Last Quiz</h3>
                    <p className="text-sm text-gray-500">{savedQuiz.length} Questions Available</p>
                 </div>
              </div>
              <button 
                onClick={() => onUpload(savedQuiz)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all flex items-center gap-2"
              >
                Start <Play size={16} className="fill-current" />
              </button>
           </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileJson size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Mode</h2>
          <p className="text-gray-500 mb-8">Upload a JSON file to start an interactive quiz.</p>
          
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
      </div>
    </div>
  );
}
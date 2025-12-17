import React, { useState } from 'react';
import { BookOpen, Play } from 'lucide-react';

export default function SetupView({ onStart }) {
  const [count, setCount] = useState(100);
  const [startNum, setStartNum] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(count, startNum);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Start New Session</h2>
        <p className="text-gray-500 mb-8">Configure your practice session</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex gap-4">
            <div className="relative flex-1">
               <label className="block text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Start #</label>
               <input 
                 type="number" 
                 min="1" 
                 value={startNum}
                 onChange={(e) => setStartNum(Math.max(1, parseInt(e.target.value) || 0))}
                 className="w-full text-center text-3xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none py-2 bg-transparent transition-colors"
               />
            </div>

            <div className="relative flex-1">
               <label className="block text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Count</label>
               <input 
                 type="number" 
                 min="1" 
                 max="500"
                 value={count}
                 onChange={(e) => setCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 0)))}
                 className="w-full text-center text-3xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none py-2 bg-transparent transition-colors"
                 autoFocus
               />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
          >
            Start Quiz <Play size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </form>
      </div>
      <p className="mt-8 text-sm text-gray-400">Maximum 500 questions per session</p>
    </div>
  );
}
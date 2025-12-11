import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2 } from 'lucide-react';
import { db } from '../lib/db';

export default function HistoryView() {
  const [sessions, setSessions] = useState([]);

  const refresh = async () => {
    const all = await db.sessions.orderBy('timestamp').reverse().toArray();
    setSessions(all);
  };

  useEffect(() => { refresh(); }, []);

  const handleExport = async () => {
    const allData = await db.sessions.toArray();
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
           await db.sessions.bulkAdd(data);
           alert("Import successful!");
           refresh();
        }
      } catch (err) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id) => {
    if(confirm("Delete this session?")) {
      await db.sessions.delete(id);
      refresh();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-6 animate-in fade-in">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Logbook</h2>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors">
              <Upload size={16} /> Import
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download size={16} /> Export
            </button>
          </div>
       </div>

       <div className="space-y-3">
         {sessions.map(s => (
           <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-700">{new Date(s.timestamp).toLocaleDateString()}</span>
                  <span className="text-gray-400 text-xs">{new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex gap-2">
                  {s.tags?.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase">Accuracy</div>
                    <div className="font-bold text-blue-600">{Math.round(s.stats.accuracy * 100)}%</div>
                 </div>
                 <div className="text-right hidden md:block">
                    <div className="text-xs text-gray-400 uppercase">Questions</div>
                    <div className="font-bold text-gray-700">{s.totalQuestions}</div>
                 </div>
                 <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                   <Trash2 size={18} />
                 </button>
              </div>
           </div>
         ))}
         {sessions.length === 0 && <div className="text-center py-10 text-gray-400">No history available.</div>}
       </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';

export default function StatsView() {
  const [timeRange, setTimeRange] = useState('weekly');
  const [stats, setStats] = useState({ correct: 0, wrong: 0, skipped: 0, total: 0 });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === 'daily') startDate.setHours(0,0,0,0);
      if (timeRange === 'weekly') startDate.setDate(now.getDate() - 7);
      if (timeRange === 'monthly') startDate.setMonth(now.getMonth() - 1);

      const loadedSessions = await db.sessions
        .where('timestamp')
        .aboveOrEqual(startDate)
        .toArray();

      setSessions(loadedSessions);

      const agg = loadedSessions.reduce((acc, sess) => ({
        correct: acc.correct + sess.stats.correct,
        wrong: acc.wrong + sess.stats.wrong,
        skipped: acc.skipped + sess.stats.skipped,
        total: acc.total + sess.totalQuestions
      }), { correct: 0, wrong: 0, skipped: 0, total: 0 });

      setStats(agg);
    };
    loadStats();
  }, [timeRange]);

  const accuracy = stats.correct + stats.wrong > 0 
    ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in p-2 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Performance Analytics</h2>
        <div className="flex bg-gray-200 rounded-lg p-1">
          {['daily', 'weekly', 'monthly'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-all ${timeRange === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Accuracy</div>
          <div className="text-3xl font-bold text-gray-800">{accuracy}%</div>
          <div className="w-full bg-gray-100 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${accuracy}%` }} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Correct</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.correct}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Wrong</div>
          <div className="text-3xl font-bold text-red-500">{stats.wrong}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Sessions</div>
          <div className="text-3xl font-bold text-gray-800">{sessions.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700">Recent Sessions in Range</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Tags</th>
                <th className="px-6 py-3 font-medium text-center">Score</th>
                <th className="px-6 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(sess => (
                <tr key={sess.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{new Date(sess.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {sess.tags.map(t => <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{t}</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center font-mono">
                    <span className="text-emerald-600 font-bold">{sess.stats.correct}</span> / 
                    <span className="text-red-500 font-bold ml-1">{sess.stats.wrong}</span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-400">
                     {Math.round(sess.stats.accuracy * 100)}%
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No sessions found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { getScanExplanation } from '@/lib/aiService';

export default function AIScanExplanation({ scanResults }: { scanResults: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    if (open) {
      setLoading(true);
      setExplanation('');
      setError('');
      getScanExplanation(scanResults)
        .then(res => setExplanation(res))
        .catch(() => setError('AI explanation failed or blocked by guardrails'))
        .finally(() => setLoading(false));
      idleTimeout = setTimeout(() => setOpen(false), 120000); // auto-close after 2 min
    }
    return () => clearTimeout(idleTimeout);
  }, [open, scanResults]);
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded shadow hover:from-cyan-600 hover:to-purple-600"
        onClick={() => setOpen(v => !v)}
        title="AI Risk Explanation"
      >
        {open ? 'Close AI Panel' : 'AI Explanation'}
      </button>
      {open && (
        <div className="mt-4 w-96 bg-slate-900 border border-cyan-400 rounded-lg shadow-lg p-6 text-white animate-fade-in">
          <h3 className="text-lg font-bold mb-2">AI Risk Explanation</h3>
          {loading && <div className="text-cyan-300 animate-pulse">Loading AI analysis...</div>}
          {error && <div className="text-red-400">{error}</div>}
          {explanation && <div className="text-gray-200 whitespace-pre-line">{explanation}</div>}
          <div className="mt-2 text-xs text-gray-400">AI answers are strictly ethical and never suggest exploits.</div>
        </div>
      )}
    </div>
  );
}

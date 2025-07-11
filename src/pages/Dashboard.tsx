import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AIScanExplanation from '@/components/Scan/AIScanExplanation';

export default function Dashboard() {
  const [domain, setDomain] = useState('');
  const [scanResults, setScanResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setHistory(data || []);
      }
    }
    fetchHistory();
  }, []);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setScanResults(null);
    // Simulate scan logic (replace with real API call)
    setTimeout(() => {
      const mockResults = {
        domain,
        findings: [
          { type: 'API Key', risk: 'high', description: 'Exposed API key found in public repo.' },
          { type: 'Config File', risk: 'medium', description: 'Config file with sensitive info.' }
        ],
        timestamp: new Date().toISOString()
      };
      setScanResults(mockResults);
      setLoading(false);
      // Save to history
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('scans').insert({
            user_id: user.id,
            domain,
            results: mockResults,
            status: 'completed',
            created_at: new Date().toISOString()
          });
        }
      });
    }, 2000);
  }

  function handleExport(type: 'json' | 'pdf') {
    if (!scanResults) return;
    if (type === 'json') {
      const blob = new Blob([JSON.stringify(scanResults, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${domain}-scan-results.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'pdf') {
      const win = window.open('', '', 'width=900,height=700');
      if (win) {
        win.document.body.innerHTML = `<h1>Scan Results for ${domain}</h1><pre>${JSON.stringify(scanResults, null, 2)}</pre>`;
        win.print();
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <form className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8" onSubmit={handleScan}>
          <h2 className="text-2xl font-bold text-white mb-4">Domain Security Scan</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded bg-slate-700 text-white border border-cyan-400 focus:outline-none focus:border-pink-400"
              placeholder="Enter domain (e.g. example.com)"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              required
            />
            <button
              type="submit"
              className="px-6 py-2 rounded bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50"
              disabled={loading || !domain.trim()}
            >
              {loading ? <span className="animate-spin mr-2">🔄</span> : 'Start Scan'}
            </button>
          </div>
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        </form>

        {scanResults && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
            <h3 className="text-lg font-bold text-white mb-2">Scan Results</h3>
            <div className="space-y-2">
              {scanResults.findings.map((f: any, i: number) => (
                <div key={i} className="p-3 rounded border border-cyan-400 bg-slate-900 text-white">
                  <span className="font-semibold text-pink-400">{f.type}</span> - <span className="text-yellow-300">{f.risk}</span>
                  <div className="text-gray-300 text-sm mt-1">{f.description}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4">
              <button
                className="px-4 py-2 rounded bg-cyan-500 text-white hover:bg-cyan-600"
                onClick={() => handleExport('json')}
                title="Export as JSON"
              >Export JSON</button>
              <button
                className="px-4 py-2 rounded bg-pink-500 text-white hover:bg-pink-600"
                onClick={() => handleExport('pdf')}
                title="Export as PDF"
              >Export PDF</button>
              <button
                className="px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600"
                onClick={() => setShowAI(true)}
                title="AI Risk Explanation"
              >AI Explanation</button>
            </div>
            {showAI && <AIScanExplanation scanResults={scanResults} />}
          </div>
        )}

        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-white mb-2">Scan History</h3>
          <div className="space-y-2">
            {history.length === 0 && <div className="text-gray-400">No past scans found.</div>}
            {history.map((h, i) => (
              <div key={i} className="p-3 rounded border border-purple-400 bg-slate-900 text-white">
                <div className="font-semibold text-cyan-400">{h.domain}</div>
                <div className="text-gray-300 text-sm">{new Date(h.created_at).toLocaleString()}</div>
                <div className="text-gray-400 text-xs">{h.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

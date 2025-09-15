
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [scanRules, setScanRules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tab, setTab] = useState('users');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (userRow?.role !== 'owner' && userRow?.role !== 'admin') {
        window.location.href = '/dashboard';
        return;
      }
      setUser(user);
      // Fetch all users
      const { data: allUsers } = await supabase.from('users').select('*');
      setUsers(allUsers || []);
      // Fetch all scans
      const { data: allScans } = await supabase.from('scans').select('*').order('created_at', { ascending: false });
      setScans(allScans || []);
      // Fetch scan rules
      const { data: rules } = await supabase.from('scan_rules').select('*');
      setScanRules(rules || []);
      // Fetch audit logs
      const { data: logs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
      setAuditLogs(logs || []);
    }
    fetchData();
  }, []);

  async function handleDeleteUser(id: string) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await supabase.from('users').delete().eq('id', id);
    setUsers(users.filter(u => u.id !== id));
  }

  async function handleUpdateRule(id: string, pattern: string, description: string) {
    await supabase.from('scan_rules').update({ pattern, description }).eq('id', id);
    setScanRules(scanRules.map(r => r.id === id ? { ...r, pattern, description } : r));
  }

  function handleExportLogs() {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>
        <div className="flex gap-4 mb-6">
          <button className={`px-4 py-2 rounded ${tab==='users'?'bg-cyan-500':'bg-slate-700'} text-white`} onClick={()=>setTab('users')}>Users</button>
          <button className={`px-4 py-2 rounded ${tab==='scans'?'bg-pink-500':'bg-slate-700'} text-white`} onClick={()=>setTab('scans')}>Scans</button>
          <button className={`px-4 py-2 rounded ${tab==='rules'?'bg-purple-500':'bg-slate-700'} text-white`} onClick={()=>setTab('rules')}>Scan Rules</button>
          <button className={`px-4 py-2 rounded ${tab==='logs'?'bg-yellow-500':'bg-slate-700'} text-white`} onClick={()=>setTab('logs')}>Audit Logs</button>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        {tab === 'users' && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="p-3 rounded border border-cyan-400 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-pink-400">{u.username}</span> <span className="text-gray-400">({u.email})</span>
                    <span className="ml-2 text-yellow-300">{u.role}</span>
                  </div>
                  <button className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600" onClick={()=>handleDeleteUser(u.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'scans' && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">All Scans</h2>
            <div className="space-y-2">
              {scans.map(s => (
                <div key={s.id} className="p-3 rounded border border-purple-400 bg-slate-900 text-white">
                  <div className="font-semibold text-cyan-400">{s.domain}</div>
                  <div className="text-gray-300 text-sm">{new Date(s.created_at).toLocaleString()}</div>
                  <div className="text-gray-400 text-xs">{s.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'rules' && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Scan Rules</h2>
            <div className="space-y-2">
              {scanRules.map(r => (
                <div key={r.id} className="p-3 rounded border border-purple-400 bg-slate-900 text-white flex items-center gap-2">
                  <input className="px-2 py-1 rounded bg-slate-700 text-white border border-cyan-400" defaultValue={r.pattern} onBlur={e=>handleUpdateRule(r.id, e.target.value, r.description)} />
                  <input className="px-2 py-1 rounded bg-slate-700 text-white border border-cyan-400" defaultValue={r.description} onBlur={e=>handleUpdateRule(r.id, r.pattern, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'logs' && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Audit Logs</h2>
            <button className="px-4 py-2 rounded bg-yellow-500 text-white mb-4" onClick={handleExportLogs}>Export Logs</button>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map(l => (
                <div key={l.id} className="p-3 rounded border border-yellow-400 bg-slate-900 text-white">
                  <div className="font-semibold text-cyan-400">{l.action}</div>
                  <div className="text-gray-300 text-sm">{new Date(l.timestamp).toLocaleString()}</div>
                  <div className="text-gray-400 text-xs">User: {l.user_id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

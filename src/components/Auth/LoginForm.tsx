import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginForm({ onLogin }: { onLogin?: (user: any) => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Try login by email first
    let { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    // If failed, try username (owner/admin only)
    if (loginError) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', identifier)
        .single();
      if (userData && userData.email) {
        ({ data, error: loginError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password,
        }));
      }
    }
    setLoading(false);
    if (loginError || !data?.user) {
      setError('Invalid credentials or account not found');
      return;
    }
    // Fetch user role
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();
    if (onLogin) onLogin({ ...data.user, role: userRow?.role });
    // Redirect based on role
    if (userRow?.role === 'owner' || userRow?.role === 'admin') {
      window.location.href = '/admin-dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form
        className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md space-y-6"
        onSubmit={handleLogin}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Sign In</h2>
        <div>
          <label className="block text-gray-300 mb-1">Email or Username</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-cyan-400 focus:outline-none focus:border-pink-400"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-cyan-400 focus:outline-none focus:border-pink-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 rounded bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

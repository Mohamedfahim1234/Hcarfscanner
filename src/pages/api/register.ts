import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { hashPassword } from '@/lib/hashPassword';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, username, password, role } = req.body;
  if (!email || !username || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashed = await hashPassword(password);
    // Create user in Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    // Insert user row with hashed password and role
    await supabase.from('users').insert({
      id: data.user.id,
      email,
      username,
      role,
      created_at: new Date().toISOString(),
      password_hash: hashed,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { comparePassword } from '@/lib/hashPassword';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Try email first
    let { data: userRow } = await supabase
      .from('users')
      .select('*')
      .eq('email', identifier)
      .single();
    // If not found, try username
    if (!userRow) {
      ({ data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('username', identifier)
        .single());
    }
    if (!userRow) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await comparePassword(password, userRow.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    // Issue JWT or session (Supabase handles this)
    return res.status(200).json({ success: true, user: userRow });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
}

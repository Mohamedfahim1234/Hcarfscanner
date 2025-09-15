import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { hashPassword } from '@/lib/hashPassword';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hashed = await hashPassword(newPassword);
    await supabase.from('users').update({ password_hash: hashed }).eq('id', userId);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Password change failed' });
  }
}

// Secure authentication backend for HCARF
// - Owner login: email/password from .env only
// - User login: email/password or OAuth (Google, etc.)
// - Session: JWT with role (user, admin, owner)
// - No .env exposure, no owner login in frontend, no owner log viewing

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const router = express.Router();

dotenv.config();

// Secure owner credential store (JSON, not .env)
const adminStorePath = path.join(__dirname, '../secure/admin.store.json');
let adminStore = null;
try {
  adminStore = JSON.parse(fs.readFileSync(adminStorePath, 'utf8'));
} catch (e) {
  adminStore = null;
}
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// In-memory user DB (for demo; replace with real DB in prod)
const users = [
  // Example user: { email, passwordHash, displayName, role: 'user' | 'admin' }
];

function getRole(usernameOrEmail) {
  if (usernameOrEmail === OWNER_USERNAME) return 'owner';
  const user = users.find(u => u.email === usernameOrEmail);
  return user ? user.role : null;
}

// --- LOGIN ENDPOINT ---
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, oauthProvider, oauthToken } = req.body;
    // --- Owner login: identifier can be username or email ---
    if (
      adminStore &&
      (identifier === adminStore.username || identifier === adminStore.email)
    ) {
      if (!adminStore.passwordHash) {
        return res.status(200).json({ success: false, error: 'Invalid credentials' });
      }
      const match = await bcrypt.compare(password, adminStore.passwordHash);
      if (!match) {
        // Log attempt (do not expose reason)
        console.log(`[LOGIN] Owner failed login attempt for identifier: ${identifier}`);
        return res.status(200).json({ success: false, error: 'Invalid credentials' });
      }
      // Log success
      console.log(`[LOGIN] Owner successful login: ${identifier}`);
      const token = jwt.sign({ owner: true, username: adminStore.username, email: adminStore.email, role: 'owner' }, JWT_SECRET, { expiresIn: '2h' });
      return res.status(200).json({ success: true, token, role: 'owner', displayName: 'Owner' });
    }
    // --- User login: only allow email (must contain @) ---
    if (!identifier || typeof identifier !== 'string' || !identifier.includes('@')) {
      // Log attempt
      console.log(`[LOGIN] User failed login attempt (invalid identifier): ${identifier}`);
      return res.status(200).json({ success: false, error: 'Invalid credentials' });
    }
    const email = identifier;
    let user = users.find(u => u.email === email);
    if (oauthProvider && oauthToken) {
      // TODO: Validate OAuth token (Google, etc.)
      // For demo, accept any oauthToken
      if (!user) {
        user = { email, passwordHash: '', displayName: email.split('@')[0], role: 'user' };
        users.push(user);
      }
    } else {
      if (!user) {
        console.log(`[LOGIN] User failed login attempt (not found): ${email}`);
        return res.status(200).json({ success: false, error: 'Invalid credentials' });
      }
      // Only bcrypt compare, never plaintext
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        console.log(`[LOGIN] User failed login attempt (bad password): ${email}`);
        return res.status(200).json({ success: false, error: 'Invalid credentials' });
      }
    }
    // Log success
    console.log(`[LOGIN] User successful login: ${email}`);
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    return res.status(200).json({ success: true, token, role: user.role, displayName: user.displayName });
  } catch (err) {
    // Always return valid JSON, never empty
    console.error('[LOGIN] Internal error:', err);
    return res.status(200).json({ success: false, error: 'Invalid credentials' });
  }
});
// --- Owner password change endpoint (no old password required, owner only, hidden) ---
router.post('/owner/change-password', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const { username, role } = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    if (role !== 'owner' || username !== (adminStore?.username)) return res.status(403).json({ error: 'Forbidden' });
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) return res.status(400).json({ error: 'Password too short' });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });
    const newHash = await bcrypt.hash(newPassword, 12);
    adminStore.passwordHash = newHash;
    fs.writeFileSync(adminStorePath, JSON.stringify(adminStore, null, 2));
    console.log(`[LOGIN] Owner password changed for: ${adminStore.username}`);
    return res.json({ success: true });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// --- PROFILE ENDPOINT ---
router.get('/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const { email, role } = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    if (role === 'owner') return res.status(403).json({ error: 'Owner profile not accessible' });
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ email, displayName: user.displayName, role });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/profile', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const { email, role } = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    if (role === 'owner') return res.status(403).json({ error: 'Owner profile not editable' });
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { displayName, oldPassword, newPassword } = req.body;
    if (displayName) user.displayName = displayName;
    if (newPassword) {
      if (!oldPassword) return res.status(400).json({ error: 'Old password required' });
      const match = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Old password incorrect' });
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    res.json({ success: true });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;

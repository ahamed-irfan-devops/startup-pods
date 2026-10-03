const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../database/db');
const { JWT_SECRET, authenticateToken, createAuditLog } = require('../middleware/auth');

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await db.prepare(`
    SELECT u.*, c.name as company_name, c.status as company_status
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.email = ?
  `).get(email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Your user account is inactive. Please contact system admin.' });
  }

  if (user.role === 'COMPANY_HR' && user.company_status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Your company account is currently inactive.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, company_id: user.company_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  await createAuditLog({ user, ip: req.ip }, 'USER_LOGIN', 'USER', user.id, null, 'Logged in successfully');

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      company_name: user.company_name
    }
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  const user = await db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.company_id, u.status, c.name as company_name
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.id = ?
  `).get(req.user.id);

  return res.json({ user });
});

/**
 * GET /api/auth/demo-accounts
 * Quick selector helper for UI fast role testing
 */
router.get('/demo-accounts', async (req, res) => {
  const superAdmin = await db.prepare("SELECT email, 'superadmin' as role_label FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").get();
  const centralAdmin = await db.prepare("SELECT email, 'central_admin' as role_label FROM users WHERE role = 'CENTRAL_ADMIN' LIMIT 1").get();
  const hrUsers = await db.prepare("SELECT u.email, u.name as hr_name, c.name as company_name FROM users u JOIN companies c ON u.company_id = c.id WHERE u.role = 'COMPANY_HR' AND u.status = 'ACTIVE' LIMIT 10").all();

  return res.json({
    superAdmin: superAdmin ? { email: superAdmin.email, password: 'test@spxirff', label: 'Super Admin (Full System Control)' } : null,
    centralAdmin: centralAdmin ? { email: centralAdmin.email, password: 'admin123', label: 'Central Cabin Admin (Approver)' } : null,
    companyHRs: hrUsers.map(hr => ({
      email: hr.email,
      password: 'password123', // Default or initial password
      label: `${hr.hr_name} (${(hr.company_name || '').trim()})`
    }))
  });
});

/**
 * GET /api/auth/verify-activation-token
 * Validates activation token and returns user details for activate account UI
 */
router.get('/verify-activation-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Activation token is missing.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.activation_token_expires_at,
             c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.activation_token_hash = ?
    `).get(tokenHash);

    if (!user) {
      return res.status(400).json({ error: 'Invalid activation token or link.' });
    }

    if (user.status === 'ACTIVE') {
      return res.status(400).json({ error: 'This account has already been activated. Please log in.' });
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({ error: 'This account is not eligible for activation. Contact your administrator.' });
    }

    if (user.activation_token_expires_at && new Date(user.activation_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Activation link has expired (24-hour limit). Please ask your administrator to resend your invitation.' });
    }

    return res.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        company_name: user.company_name
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify activation token.' });
  }
});

/**
 * POST /api/auth/activate-account
 * Validates token & password strength, hashes password, and activates account
 */
router.post('/activate-account', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Token, password, and confirm password are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one uppercase letter (A-Z).' });
  }

  const WEAK_PASSWORDS = [
    'password', 'password123', 'password1234', 'pass1234', 'password12345',
    'admin123', 'admin1234', 'administrator', '12345678', '123456789', '1234567890',
    'qwertyuiop', 'qwerty123', 'welcome123', 'welcome1', 'letmein123', 'letmein1',
    'superadmin', 'superadmin123', 'startuppark', 'ique1234', 'abc12345',
    'p@ssword', 'p@ssword123', 'admin@123', 'password@123'
  ];

  const lowerPass = password.toLowerCase().trim();
  if (WEAK_PASSWORDS.includes(lowerPass) || lowerPass.startsWith('password') || lowerPass.startsWith('admin123')) {
    return res.status(400).json({ error: 'Password is too common or simple. Please choose a unique, secure password.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await db.prepare(`
      SELECT id, name, email, status, activation_token_expires_at
      FROM users
      WHERE activation_token_hash = ?
    `).get(tokenHash);

    if (!user) {
      return res.status(400).json({ error: 'Invalid activation token.' });
    }

    if (user.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Account is already activated. Please log in.' });
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({ error: 'Account cannot be activated. Contact administrator.' });
    }

    if (user.activation_token_expires_at && new Date(user.activation_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Activation link has expired. Please ask your administrator to resend the invitation.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE users
      SET password_hash = ?,
          status = 'ACTIVE',
          activated_at = ?,
          activation_token_hash = NULL,
          activation_token_expires_at = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(hash, now, now, user.id);

    await createAuditLog({ user, ip: req.ip }, 'ACCOUNT_ACTIVATED', 'USER', user.id, 'PENDING', 'ACTIVE');

    return res.json({
      success: true,
      message: 'Your account has been activated successfully! You can now log in.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to activate account.' });
  }
});

module.exports = router;

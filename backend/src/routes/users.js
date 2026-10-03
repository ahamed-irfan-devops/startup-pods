const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, withTransaction } = require('../database/db');
const { authenticateToken, requireRole, createAuditLog } = require('../middleware/auth');
const crypto = require('crypto');
const { sendAccountInvitationEmail, sendUserWelcomeEmail } = require('../services/emailService');

/**
 * GET /api/users
 */
router.get('/', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const { role, company_id, search } = req.query;

  let query = `
    SELECT u.id, u.name, u.email, u.role, u.status, u.created_at, u.activated_at,
           c.id as company_id, c.name as company_name
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (role) {
    query += ` AND u.role = ?`;
    params.push(role);
  }

  if (company_id) {
    query += ` AND u.company_id = ?`;
    params.push(company_id);
  }

  if (search) {
    query += ` AND (u.name ILIKE ? OR u.email ILIKE ? OR c.name ILIKE ?)`;
    const p = `%${search}%`;
    params.push(p, p, p);
  }

  query += ` ORDER BY u.created_at DESC`;

  const users = await db.prepare(query).all(...params);
  return res.json({ users });
});

/**
 * POST /api/users
 * Super Admin / Central Admin creates user account & dispatches account invitation email
 */
router.post('/', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const { name, email, role, company_id, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required.' });
  }

  if (role === 'COMPANY_HR' && !company_id) {
    return res.status(400).json({ error: 'Company must be specified for Company HR users.' });
  }

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'A user account with this email address already exists.' });
  }

  let companyName = '';
  if (company_id) {
    const comp = await db.prepare('SELECT name FROM companies WHERE id = ?').get(company_id);
    if (comp) companyName = comp.name;
  }

  const passwordToUse = (password && password.trim()) ? password.trim() : 'StartupPod@2026';
  const hash = bcrypt.hashSync(passwordToUse, 10);

  try {
    const info = await db.prepare(`
      INSERT INTO users (name, email, password_hash, role, company_id, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `).run(name, email, hash, role, company_id || null);

    const newUser = await db.prepare('SELECT id, name, email, role, company_id, status FROM users WHERE id = ?').get(info.lastInsertRowid);
    await createAuditLog(req, 'USER_CREATED', 'USER', newUser.id, null, newUser);

    sendUserWelcomeEmail({
      toEmail: newUser.email,
      userName: newUser.name,
      companyName: companyName,
      password: passwordToUse,
      role: newUser.role
    }).catch(err => console.error('Failed sending log email:', err));

    return res.status(201).json({
      success: true,
      message: `User '${newUser.name}' created successfully (Login Email: ${newUser.email}, Password: ${passwordToUse})`,
      user: newUser
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create user account.' });
  }
});

/**
 * POST /api/users/:id/resend-invitation
 * Resend activation invitation email for pending users
 */
router.post('/:id/resend-invitation', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const userId = req.params.id;

  const user = await db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.status, u.company_id, c.name as company_name
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  if (user.status !== 'PENDING') {
    return res.status(400).json({ error: 'Only pending accounts can be resent an invitation.' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  try {
    const mailRes = await sendAccountInvitationEmail({
      toEmail: user.email,
      userName: user.name,
      companyName: user.company_name,
      role: user.role,
      rawToken
    });

    if (!mailRes.success) {
      return res.status(500).json({ error: `Failed to resend invitation email to ${user.email}: ${mailRes.error || 'SMTP delivery failed'}` });
    }

    await db.prepare(`
      UPDATE users
      SET activation_token_hash = ?,
          activation_token_expires_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(tokenHash, expiresAt, user.id);

    await createAuditLog(req, 'INVITATION_RESENT', 'USER', user.id, null, { email: user.email });

    return res.json({
      success: true,
      message: `Invitation email resent successfully to ${user.email}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to resend invitation email.' });
  }
});

/**
 * PUT /api/users/:id
 * Super Admin updates user account
 */
router.put('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, role, company_id, status } = req.body;

  const existing = await db.prepare('SELECT id, name, email, role, company_id, status FROM users WHERE id = ?').get(userId);
  if (!existing) {
    return res.status(404).json({ error: 'User not found.' });
  }

  let hash = null;
  if (password && password.trim()) {
    hash = bcrypt.hashSync(password.trim(), 10);
  }

  await db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        password_hash = COALESCE(?, password_hash),
        role = COALESCE(?, role),
        company_id = COALESCE(?, company_id),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, email, hash, role, company_id, status, userId);

  const updated = await db.prepare('SELECT id, name, email, role, company_id, status FROM users WHERE id = ?').get(userId);
  await createAuditLog(req, 'USER_UPDATED', 'USER', userId, existing, updated);

  return res.json({ message: 'User updated successfully.', user: updated });
});

/**
 * DELETE /api/users/:id
 * Super Admin deletes user account
 */
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id === userId) {
    return res.status(400).json({ error: 'Security restriction: You cannot delete your own active administrator account.' });
  }

  const existing = await db.prepare('SELECT id, name, email, role, company_id FROM users WHERE id = ?').get(userId);
  if (!existing) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  try {
    await withTransaction(async (txDb) => {
      // 1. Delete notifications for user
      await txDb.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
      // 2. Clear approved_by / cancelled_by references in bookings
      await txDb.prepare('UPDATE bookings SET approved_by = NULL WHERE approved_by = ?').run(userId);
      await txDb.prepare('UPDATE bookings SET cancelled_by = NULL WHERE cancelled_by = ?').run(userId);
      // 3. Clear or delete user bookings
      await txDb.prepare('DELETE FROM bookings WHERE user_id = ?').run(userId);
      // 4. Delete user
      await txDb.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    await createAuditLog(req, 'USER_DELETED', 'USER', userId, existing, null);

    return res.json({ message: `User account '${existing.name}' (${existing.email}) deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete user account.' });
  }
});

module.exports = router;

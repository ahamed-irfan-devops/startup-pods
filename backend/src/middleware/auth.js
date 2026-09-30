const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cabin_booking_secret_key_2026_super_secure';

/**
 * Authenticate incoming requests via Bearer JWT token
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing. Please log in.' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);

    // Verify user is active in DB
    const dbUser = await db.prepare('SELECT id, company_id, name, email, role, status FROM users WHERE id = ?').get(user.id);

    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User account is deactivated or invalid.' });
    }

    // If Company HR, verify company is active
    if (dbUser.role === 'COMPANY_HR' && dbUser.company_id) {
      const company = await db.prepare('SELECT status FROM companies WHERE id = ?').get(dbUser.company_id);
      if (!company || company.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Your company account is inactive. Booking creation is disabled.' });
      }
    }

    req.user = dbUser;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

/**
 * Enforce minimum user role requirement
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Unauthorized role.' });
    }
    next();
  };
}

/**
 * Helper to record Audit Log entries
 */
async function createAuditLog(req, action, targetType, targetId = null, oldValue = null, newValue = null) {
  try {
    const user = req.user || { id: null, name: 'System', role: 'SYSTEM' };
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    await db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, role, action, target_type, target_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.name,
      user.role,
      action,
      targetType,
      String(targetId || ''),
      typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue,
      typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
      ip
    );
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
}

/**
 * Helper to send in-app notification
 */
async function sendNotification(userId, companyId, title, message, type = 'INFO') {
  try {
    await db.prepare(`
      INSERT INTO notifications (user_id, company_id, title, message, type, is_read)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(userId, companyId, title, message, type);
  } catch (err) {
    console.error('Notification Error:', err);
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
  createAuditLog,
  sendNotification
};

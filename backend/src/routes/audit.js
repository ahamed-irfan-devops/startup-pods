const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Automatically prune audit logs older than 30 days
 */
async function pruneOldAuditLogs() {
  try {
    await db.exec(`DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days'`);
  } catch (err) {
    console.error('Failed to prune old audit logs:', err.message);
  }
}

/**
 * GET /api/audit-logs
 * Super Admin & Central Admin audit trail lookup (retains logs for 30 days max)
 */
router.get('/', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  // Automatically prune any audit log records older than 30 days
  await pruneOldAuditLogs();

  const { action, target_type, search, days = '30' } = req.query;

  let query = `
    SELECT * FROM audit_logs
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `;
  const params = [];

  if (days && days !== '30') {
    const numDays = parseInt(days, 10) || 30;
    query += ` AND created_at >= NOW() - INTERVAL '${numDays} days'`;
  }

  if (action) {
    query += ` AND action = ?`;
    params.push(action);
  }

  if (target_type) {
    query += ` AND target_type = ?`;
    params.push(target_type);
  }

  if (search) {
    query += ` AND (user_name ILIKE ? OR action ILIKE ? OR target_id ILIKE ? OR new_value ILIKE ?)`;
    const p = `%${search}%`;
    params.push(p, p, p, p);
  }

  query += ` ORDER BY created_at DESC LIMIT 500`;

  const logs = await db.prepare(query).all(...params);
  return res.json({ logs });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/audit-logs
 * Super Admin & Central Admin audit trail lookup
 */
router.get('/', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const { action, target_type, search } = req.query;

  let query = `
    SELECT * FROM audit_logs
    WHERE 1=1
  `;
  const params = [];

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

  query += ` ORDER BY created_at DESC LIMIT 200`;

  const logs = await db.prepare(query).all(...params);
  return res.json({ logs });
});

module.exports = router;

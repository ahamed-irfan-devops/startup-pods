const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req, res) => {
  let query = `
    SELECT * FROM notifications
    WHERE user_id = ? OR company_id = ?
    ORDER BY created_at DESC LIMIT 50
  `;
  const notifications = await db.prepare(query).all(req.user.id, req.user.company_id || -1);
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return res.json({ notifications, unreadCount });
});

/**
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Marked as read.' });
});

/**
 * PUT /api/notifications/mark-all-read
 */
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR company_id = ?').run(req.user.id, req.user.company_id || -1);
  return res.json({ message: 'All notifications marked as read.' });
});

module.exports = router;

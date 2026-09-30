const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken, requireRole, createAuditLog } = require('../middleware/auth');

/**
 * GET /api/rules
 */
router.get('/', authenticateToken, async (req, res) => {
  const rules = await db.prepare('SELECT * FROM booking_rules WHERE id = 1').get();
  return res.json({ rules });
});

/**
 * PUT /api/rules
 * Super Admin modifies system booking rules
 */
router.put('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const {
    min_duration_minutes,
    max_duration_minutes,
    step_minutes,
    allow_auto_approval,
    cancellation_cutoff_minutes,
    office_start_time,
    office_end_time,
    operating_days
  } = req.body;

  const oldRules = await db.prepare('SELECT * FROM booking_rules WHERE id = 1').get();

  await db.prepare(`
    UPDATE booking_rules
    SET min_duration_minutes = COALESCE(?, min_duration_minutes),
        max_duration_minutes = COALESCE(?, max_duration_minutes),
        step_minutes = COALESCE(?, step_minutes),
        allow_auto_approval = COALESCE(?, allow_auto_approval),
        cancellation_cutoff_minutes = COALESCE(?, cancellation_cutoff_minutes),
        office_start_time = COALESCE(?, office_start_time),
        office_end_time = COALESCE(?, office_end_time),
        operating_days = COALESCE(?, operating_days),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    min_duration_minutes,
    max_duration_minutes,
    step_minutes,
    allow_auto_approval,
    cancellation_cutoff_minutes,
    office_start_time,
    office_end_time,
    operating_days
  );

  const updated = await db.prepare('SELECT * FROM booking_rules WHERE id = 1').get();
  await createAuditLog(req, 'RULES_UPDATED', 'SYSTEM_SETTINGS', '1', oldRules, updated);

  return res.json({ message: 'Booking rules updated successfully.', rules: updated });
});

module.exports = router;

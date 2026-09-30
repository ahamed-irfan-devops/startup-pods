const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken, requireRole, createAuditLog } = require('../middleware/auth');

/**
 * GET /api/cabins
 * Available to all logged-in users
 */
router.get('/', authenticateToken, async (req, res) => {
  const cabins = await db.prepare('SELECT * FROM cabins ORDER BY id ASC').all();
  const parsed = cabins.map(c => ({
    ...c,
    amenities: c.amenities ? (typeof c.amenities === 'string' ? JSON.parse(c.amenities) : c.amenities) : []
  }));
  return res.json({ cabins: parsed });
});

/**
 * POST /api/cabins
 * Super Admin creates new cabin
 */
router.post('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { name, location, capacity, status, description, amenities, image_url } = req.body;

  if (!name || !location || !capacity) {
    return res.status(400).json({ error: 'Name, location, and capacity are required.' });
  }

  const existing = await db.prepare('SELECT id FROM cabins WHERE name = ?').get(name);
  if (existing) {
    return res.status(400).json({ error: 'A cabin with this name already exists.' });
  }

  const stmt = db.prepare(`
    INSERT INTO cabins (name, location, capacity, status, description, amenities, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const info = await stmt.run(
    name,
    location,
    capacity,
    status || 'AVAILABLE',
    description || '',
    JSON.stringify(amenities || []),
    image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
  );

  const newCabin = await db.prepare('SELECT * FROM cabins WHERE id = ?').get(info.lastInsertRowid);
  await createAuditLog(req, 'CABIN_CREATED', 'CABIN', newCabin.id, null, newCabin);

  return res.status(201).json({ message: 'Cabin created successfully.', cabin: newCabin });
});

/**
 * PUT /api/cabins/:id
 * Super Admin updates cabin details or status (e.g. MAINTENANCE)
 */
router.put('/:id', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const cabinId = req.params.id;
  const { name, location, capacity, status, description, amenities } = req.body;

  const existing = await db.prepare('SELECT * FROM cabins WHERE id = ?').get(cabinId);
  if (!existing) {
    return res.status(404).json({ error: 'Cabin not found.' });
  }

  await db.prepare(`
    UPDATE cabins
    SET name = COALESCE(?, name),
        location = COALESCE(?, location),
        capacity = COALESCE(?, capacity),
        status = COALESCE(?, status),
        description = COALESCE(?, description),
        amenities = COALESCE(?, amenities),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name,
    location,
    capacity,
    status,
    description,
    amenities ? JSON.stringify(amenities) : null,
    cabinId
  );

  const updated = await db.prepare('SELECT * FROM cabins WHERE id = ?').get(cabinId);
  await createAuditLog(req, 'CABIN_UPDATED', 'CABIN', cabinId, existing, updated);

  return res.json({ message: 'Cabin updated successfully.', cabin: updated });
});

/**
 * DELETE /api/cabins/:id
 * Super Admin deletes a shared meeting cabin
 */
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  const cabinId = req.params.id;

  const existing = await db.prepare('SELECT * FROM cabins WHERE id = ?').get(cabinId);
  if (!existing) {
    return res.status(404).json({ error: 'Cabin not found.' });
  }

  // Delete associated bookings & audit log
  await db.prepare('DELETE FROM bookings WHERE cabin_id = ?').run(cabinId);
  await db.prepare('DELETE FROM cabins WHERE id = ?').run(cabinId);

  await createAuditLog(req, 'CABIN_DELETED', 'CABIN', cabinId, existing, null);

  return res.json({ message: `Cabin '${existing.name}' deleted successfully.` });
});

module.exports = router;

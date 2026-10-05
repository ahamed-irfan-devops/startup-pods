const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, withTransaction } = require('../database/db');
const { authenticateToken, requireRole, createAuditLog } = require('../middleware/auth');
const { sendCompanyWelcomeEmail } = require('../services/emailService');

/**
 * GET /api/companies
 * View companies list (Super Admin & Central Admin)
 */
router.get('/', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const { search, status } = req.query;

  let query = `
    SELECT c.*,
           COUNT(u.id) as hr_count,
           (SELECT COUNT(*) FROM bookings b WHERE b.company_id = c.id) as total_bookings
    FROM companies c
    LEFT JOIN users u ON u.company_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (c.name ILIKE ? OR c.email ILIKE ? OR c.phone ILIKE ?)`;
    const p = `%${search}%`;
    params.push(p, p, p);
  }

  query += ` GROUP BY c.id ORDER BY c.name ASC`;

  const companies = await db.prepare(query).all(...params);
  return res.json({ companies, total: companies.length });
});

/**
 * POST /api/companies
 * Super Admin & Central Admin creates company AND optional initial Company HR user account simultaneously with invitation email
 */
router.post('/', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const { name, email, phone, status, create_hr, hr_name, hr_email, hr_password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Company name and contact email are required.' });
  }

  const existingCompany = await db.prepare('SELECT id FROM companies WHERE email = ? OR name = ?').get(email, name);
  if (existingCompany) {
    return res.status(400).json({ error: 'Company with this name or email already exists.' });
  }

  const userEmailToCreate = hr_email || email;
  if (create_hr) {
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(userEmailToCreate);
    if (existingUser) {
      return res.status(400).json({ error: `User account with email ${userEmailToCreate} already exists.` });
    }
  }

  try {
    let createdHRUser = null;

    const newCompany = await withTransaction(async (txDb) => {
      // 1. Insert Company
      const compInfo = await txDb.prepare(`
        INSERT INTO companies (name, email, phone, status)
        VALUES (?, ?, ?, ?)
      `).run(name, email, phone || '', status || 'ACTIVE');

      const companyId = compInfo.lastInsertRowid;
      const compObj = await txDb.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);

      // 2. Insert HR User if requested
      if (create_hr) {
        const passwordToUse = (hr_password && hr_password.trim()) ? hr_password.trim() : 'password123';
        const passwordHash = bcrypt.hashSync(passwordToUse, 10);
        const hrName = hr_name || `${name} HR Admin`;

        const userInfo = await txDb.prepare(`
          INSERT INTO users (company_id, name, email, password_hash, role, status)
          VALUES (?, ?, ?, ?, 'COMPANY_HR', 'ACTIVE')
        `).run(companyId, hrName, userEmailToCreate, passwordHash);

        createdHRUser = await txDb.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(userInfo.lastInsertRowid);
      }

      return compObj;
    });

    await createAuditLog(req, 'COMPANY_CREATED', 'COMPANY', newCompany.id, null, { company: newCompany, hr_user: createdHRUser });

    // Outbound email notification with HR login credentials
    if (createdHRUser) {
      const passwordToUse = (hr_password && hr_password.trim()) ? hr_password.trim() : 'password123';
      sendCompanyWelcomeEmail({
        toEmail: createdHRUser.email,
        hrName: createdHRUser.name,
        companyName: newCompany.name,
        password: passwordToUse
      }).then(res => {
        if (res.success) {
          console.log(`📧 [COMPANY CREATION] Welcome email sent to HR (${createdHRUser.email})`);
        } else {
          console.error(`❌ [COMPANY CREATION] Failed sending welcome email to HR (${createdHRUser.email}):`, res.error);
        }
      }).catch(err => console.error('Email sending error on company creation:', err));
    }

    return res.status(201).json({
      message: createdHRUser
        ? `Company '${newCompany.name}' and active HR account '${createdHRUser.email}' created successfully!`
        : 'Company created successfully.',
      company: newCompany,
      hr_user: createdHRUser
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create company.' });
  }
});

/**
 * PUT /api/companies/:id
 * Super Admin & Central Admin updates company or toggles status (ACTIVE/INACTIVE)
 */
router.put('/:id', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const companyId = req.params.id;
  const { name, email, phone, status } = req.body;

  const existing = await db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!existing) {
    return res.status(404).json({ error: 'Company not found.' });
  }

  await db.prepare(`
    UPDATE companies
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, email, phone, status, companyId);

  // If set to INACTIVE, update associated HR users status
  if (status && status !== existing.status) {
    await db.prepare('UPDATE users SET status = ? WHERE company_id = ?').run(status, companyId);
  }

  const updated = await db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  await createAuditLog(req, 'COMPANY_UPDATED', 'COMPANY', companyId, existing, updated);

  return res.json({ message: 'Company updated successfully.', company: updated });
});

/**
 * DELETE /api/companies/:id
 * Super Admin & Central Admin deletes company and associated HR accounts & bookings
 */
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  const companyId = req.params.id;

  const existing = await db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!existing) {
    return res.status(404).json({ error: 'Company not found.' });
  }

  try {
    await withTransaction(async (txDb) => {
      // 1. Delete notifications for company and its users
      await txDb.prepare('DELETE FROM notifications WHERE company_id = ?').run(companyId);
      await txDb.prepare('DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE company_id = ?)').run(companyId);
      
      // 2. Clear approved_by / cancelled_by references in bookings
      await txDb.prepare('UPDATE bookings SET approved_by = NULL WHERE approved_by IN (SELECT id FROM users WHERE company_id = ?)').run(companyId);
      await txDb.prepare('UPDATE bookings SET cancelled_by = NULL WHERE cancelled_by IN (SELECT id FROM users WHERE company_id = ?)').run(companyId);

      // 3. Delete company bookings
      await txDb.prepare('DELETE FROM bookings WHERE company_id = ?').run(companyId);
      
      // 4. Delete company users
      await txDb.prepare('DELETE FROM users WHERE company_id = ?').run(companyId);
      
      // 5. Delete company record
      await txDb.prepare('DELETE FROM companies WHERE id = ?').run(companyId);
    });

    await createAuditLog(req, 'COMPANY_DELETED', 'COMPANY', companyId, existing, null);

    return res.json({ message: `Company '${existing.name}' and all associated HR accounts were deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete company.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { db, withTransaction } = require('../database/db');
const { authenticateToken, requireRole, createAuditLog, sendNotification } = require('../middleware/auth');
const {
  timeToMinutes,
  generateBookingCode,
  checkBookingConflict,
  validateBookingRules
} = require('../services/bookingValidation');
const { sendBookingSubmissionEmail, sendBookingApprovalEmail, sendBookingRejectionEmail } = require('../services/emailService');

/**
 * GET /api/bookings
 * Query params: cabin_id, date, company_id, status, search
 * Role-based privacy filtering: COMPANY_HR can ONLY see their own company's bookings.
 */
router.get('/', authenticateToken, async (req, res) => {
  const { cabin_id, date, company_id, status, search, own_only } = req.query;

  let query = `
    SELECT b.*,
           c.name as cabin_name, c.location as cabin_location,
           comp.name as company_name, comp.email as company_email,
           u.name as user_name, u.email as user_email,
           appr.name as approved_by_name,
           canc.name as cancelled_by_name
    FROM bookings b
    JOIN cabins c ON b.cabin_id = c.id
    JOIN companies comp ON b.company_id = comp.id
    JOIN users u ON b.user_id = u.id
    LEFT JOIN users appr ON b.approved_by = appr.id
    LEFT JOIN users canc ON b.cancelled_by = canc.id
    WHERE 1=1
  `;
  const params = [];

  // Privacy Guard: COMPANY_HR only sees their own company when querying own bookings list
  if (req.user.role === 'COMPANY_HR' && (own_only === 'true' || !date)) {
    query += ` AND b.company_id = ?`;
    params.push(req.user.company_id);
  } else if (company_id) {
    query += ` AND b.company_id = ?`;
    params.push(company_id);
  }

  if (cabin_id) {
    query += ` AND b.cabin_id = ?`;
    params.push(cabin_id);
  }

  if (date) {
    query += ` AND b.booking_date = ?`;
    params.push(date);
  }

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (b.booking_code ILIKE ? OR comp.name ILIKE ? OR u.name ILIKE ? OR b.purpose ILIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY b.booking_date DESC, b.start_time ASC`;

  const rawBookings = await db.prepare(query).all(...params);

  // If COMPANY_HR viewing calendar/date, sanitize competitor bookings for privacy isolation
  if (req.user.role === 'COMPANY_HR') {
    const sanitized = rawBookings.map(b => {
      if (b.company_id === req.user.company_id) {
        return { ...b, is_own: true };
      }
      return {
        id: b.id,
        booking_code: 'BUSY',
        cabin_id: b.cabin_id,
        cabin_name: b.cabin_name,
        cabin_location: b.cabin_location,
        company_id: b.company_id,
        company_name: 'RESERVED',
        user_name: 'Occupied',
        user_email: '',
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        purpose: 'Reserved',
        people_count: 0,
        status: b.status,
        is_own: false
      };
    });
    return res.json({ bookings: sanitized });
  }

  return res.json({ bookings: rawBookings });
});

/**
 * GET /api/bookings/availability
 * Returns time slot grid for a cabin and date
 * For Company HR: returns slots as AVAILABLE or UNAVAILABLE without exposing competitor details!
 */
router.get('/availability', authenticateToken, async (req, res) => {
  const { cabin_id, date } = req.query;

  if (!cabin_id || !date) {
    return res.status(400).json({ error: 'cabin_id and date are required parameters.' });
  }

  const rules = await db.prepare('SELECT * FROM booking_rules WHERE id = 1').get();
  const cabin = await db.prepare('SELECT * FROM cabins WHERE id = ?').get(cabin_id);

  if (!cabin) {
    return res.status(404).json({ error: 'Cabin not found.' });
  }

  // Fetch confirmed & pending bookings for this cabin & date
  const bookings = await db.prepare(`
    SELECT b.id, b.booking_code, b.start_time, b.end_time, b.status, b.purpose, b.people_count,
           comp.name as company_name, b.company_id
    FROM bookings b
    JOIN companies comp ON b.company_id = comp.id
    WHERE b.cabin_id = ? AND b.booking_date = ? AND b.status IN ('CONFIRMED', 'PENDING')
  `).all(cabin_id, date);

  // Generate interval slots between office start and end
  const slots = [];
  const startMin = timeToMinutes(rules.office_start_time);
  const endMin = timeToMinutes(rules.office_end_time);
  const requestedStep = req.query.step ? parseInt(req.query.step) : null;
  const step = requestedStep && [15, 30, 60].includes(requestedStep) ? requestedStep : rules.step_minutes;

  for (let m = startMin; m < endMin; m += step) {
    const slotStartH = String(Math.floor(m / 60)).padStart(2, '0');
    const slotStartM = String(m % 60).padStart(2, '0');
    const slotStartStr = `${slotStartH}:${slotStartM}`;

    const slotEndM = m + step;
    const slotEndHStr = String(Math.floor(slotEndM / 60)).padStart(2, '0');
    const slotEndMStr = String(slotEndM % 60).padStart(2, '0');
    const slotEndStr = `${slotEndHStr}:${slotEndMStr}`;

    // Check if slot falls inside an existing booking
    const matchingBooking = bookings.find(b => {
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      return m >= bStart && (m + step) <= bEnd;
    });

    let status = 'AVAILABLE';
    let bookingDetails = null;

    if (cabin.status !== 'AVAILABLE') {
      status = cabin.status; // MAINTENANCE or INACTIVE
    } else if (matchingBooking) {
      status = matchingBooking.status === 'CONFIRMED' ? 'UNAVAILABLE' : 'PENDING_APPROVAL';

      // Company HR Privacy Protection
      if (req.user.role === 'COMPANY_HR') {
        if (matchingBooking.company_id === req.user.company_id) {
          bookingDetails = {
            is_own: true,
            booking_code: matchingBooking.booking_code,
            purpose: matchingBooking.purpose
          };
        } else {
          // Anonymized for other companies
          bookingDetails = { is_own: false };
        }
      } else {
        // Admins can see full details
        bookingDetails = matchingBooking;
      }
    }

    slots.push({
      start_time: slotStartStr,
      end_time: slotEndStr,
      status,
      booking: bookingDetails
    });
  }

  return res.json({ cabin, date, rules, slots });
});

/**
 * POST /api/bookings
 * Create new booking request (Company HR or Admin)
 */
router.post('/', authenticateToken, async (req, res) => {
  const { cabin_id, booking_date, start_time, end_time, purpose, people_count, notes } = req.body;

  if (!cabin_id || !booking_date || !start_time || !end_time || !purpose) {
    return res.status(400).json({ error: 'Cabin, date, start time, end time, and purpose are required.' });
  }

  // Derive company_id from authenticated user (or allow admin override if supplied)
  let companyId = req.user.company_id;
  if (req.user.role !== 'COMPANY_HR' && req.body.company_id) {
    companyId = req.body.company_id;
  }

  if (!companyId) {
    return res.status(400).json({ error: 'Valid company associated with request is required.' });
  }

  // 1. Validate rules & office hours
  const validation = await validateBookingRules(cabin_id, booking_date, start_time, end_time);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // 2. Strict DB Transaction checking for conflicts & inserting
  try {
    const result = await withTransaction(async (txDb) => {
      // Conflict check
      const conflict = await checkBookingConflict(cabin_id, booking_date, start_time, end_time);
      if (conflict.hasConfirmedConflict) {
        throw new Error(`The requested cabin is already confirmed for an overlapping time slot (${start_time} - ${end_time}).`);
      }

      const bookingCode = await generateBookingCode();
      const status = validation.rules.allow_auto_approval ? 'CONFIRMED' : 'PENDING';

      const stmt = txDb.prepare(`
        INSERT INTO bookings (
          booking_code, company_id, user_id, cabin_id, booking_date, start_time, end_time,
          purpose, people_count, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const info = await stmt.run(
        bookingCode,
        companyId,
        req.user.id,
        cabin_id,
        booking_date,
        start_time,
        end_time,
        purpose,
        people_count || 1,
        notes || '',
        status
      );

      const newBooking = await txDb.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
      return newBooking;
    });

    await createAuditLog(req, 'BOOKING_SUBMITTED', 'BOOKING', result.booking_code, null, result);

    // Notify Central Admins
    const cabin = await db.prepare('SELECT name FROM cabins WHERE id = ?').get(cabin_id);
    const company = await db.prepare('SELECT name FROM companies WHERE id = ?').get(companyId);

    await sendNotification(
      req.user.id,
      companyId,
      'Booking Request Submitted',
      `Booking request ${result.booking_code} for ${cabin ? cabin.name : 'Cabin'} on ${booking_date} (${start_time} - ${end_time}) has been submitted and is pending review.`,
      'SUBMITTED'
    );

    // Send instant email notification to the user's login email ID upon booking
    if (req.user && req.user.email) {
      console.log(`📧 [BOOKING CREATED] Sending email receipt to user login mail ID: ${req.user.email}`);
      sendBookingSubmissionEmail({
        toEmail: req.user.email,
        hrName: req.user.name,
        companyName: company ? company.name : 'Company',
        bookingCode: result.booking_code,
        cabinName: cabin ? cabin.name : 'Cabin',
        cabinLocation: cabin ? cabin.location : '',
        date: result.booking_date,
        startTime: result.start_time,
        endTime: result.end_time,
        purpose: result.purpose,
        peopleCount: result.people_count,
        isAutoApproved: result.status === 'CONFIRMED'
      }).then(res => console.log(`📧 Booking creation email result for ${req.user.email}:`, res.success ? 'SUCCESS' : res.error))
        .catch(err => console.error('Failed sending booking submission email:', err));
    }

    return res.status(201).json({
      message: 'Booking request submitted successfully.',
      booking: result
    });
  } catch (err) {
    return res.status(409).json({ error: err.message || 'Double-booking conflict encountered.' });
  }
});

/**
 * POST /api/bookings/:id/approve
 * Central Admin approves booking request
 */
router.post('/:id/approve', authenticateToken, requireRole('CENTRAL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const bookingId = req.params.id;

  const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking request not found.' });
  }

  if (booking.status === 'CONFIRMED') {
    return res.status(400).json({ error: 'Booking is already confirmed.' });
  }

  try {
    const updated = await withTransaction(async (txDb) => {
      // Re-verify double booking conflict before confirmation
      const conflict = await checkBookingConflict(booking.cabin_id, booking.booking_date, booking.start_time, booking.end_time, booking.id);

      if (conflict.hasConfirmedConflict) {
        const confDetails = conflict.conflictingBookings.map(c => `${c.booking_code} (${c.start_time}-${c.end_time})`).join(', ');
        throw new Error(`Cannot approve booking: Conflict exists with confirmed booking(s): ${confDetails}`);
      }

      const now = new Date().toISOString();
      await txDb.prepare(`
        UPDATE bookings
        SET status = 'CONFIRMED',
            approved_by = ?,
            approved_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(req.user.id, now, now, bookingId);

      return await txDb.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    });

    await createAuditLog(req, 'BOOKING_APPROVED', 'BOOKING', updated.booking_code, booking.status, 'CONFIRMED');

    // Notify Company HR via In-App Notification & Email
    const cabin = await db.prepare('SELECT name, location FROM cabins WHERE id = ?').get(updated.cabin_id);
    const userObj = await db.prepare('SELECT u.name as user_name, u.email as user_email, comp.name as company_name FROM users u JOIN companies comp ON u.company_id = comp.id WHERE u.id = ?').get(updated.user_id);

    await sendNotification(
      updated.user_id,
      updated.company_id,
      'Booking Request Approved!',
      `Great news! Your booking ${updated.booking_code} for ${cabin ? cabin.name : 'Cabin'} on ${updated.booking_date} (${updated.start_time} - ${updated.end_time}) has been APPROVED by Central Admin.`,
      'APPROVED'
    );

    if (userObj && userObj.user_email) {
      console.log(`📧 [ADMIN APPROVAL] Dispatching approval email to user login mail ID: ${userObj.user_email}`);
      sendBookingApprovalEmail({
        toEmail: userObj.user_email,
        hrName: userObj.user_name,
        companyName: userObj.company_name,
        bookingCode: updated.booking_code,
        cabinName: cabin ? cabin.name : 'Cabin',
        cabinLocation: cabin ? cabin.location : '',
        date: updated.booking_date,
        startTime: updated.start_time,
        endTime: updated.end_time,
        purpose: updated.purpose,
        peopleCount: updated.people_count
      }).then(res => console.log(`📧 Email dispatch result for ${userObj.user_email}:`, res.success ? 'SUCCESS' : res.error))
        .catch(err => console.error('Failed sending approval email:', err));
    }

    return res.json({
      message: 'Booking request approved successfully.',
      booking: updated,
      emailSentTo: userObj ? userObj.user_email : null
    });
  } catch (err) {
    return res.status(409).json({ error: err.message });
  }
});

/**
 * POST /api/bookings/:id/reject
 * Central Admin rejects booking request with mandatory reason
 */
router.post('/:id/reject', authenticateToken, requireRole('CENTRAL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const bookingId = req.params.id;
  const { rejection_reason } = req.body;

  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({ error: 'Rejection reason is required when rejecting a booking.' });
  }

  const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking request not found.' });
  }

  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE bookings
    SET status = 'REJECTED',
        rejection_reason = ?,
        updated_at = ?
    WHERE id = ?
  `).run(rejection_reason.trim(), now, bookingId);

  const updated = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

  await createAuditLog(req, 'BOOKING_REJECTED', 'BOOKING', updated.booking_code, booking.status, { status: 'REJECTED', reason: rejection_reason });

  // Notify Company HR via In-App Notification & Email
  const cabin = await db.prepare('SELECT name FROM cabins WHERE id = ?').get(updated.cabin_id);
  const userObj = await db.prepare('SELECT u.name as user_name, u.email as user_email, comp.name as company_name FROM users u JOIN companies comp ON u.company_id = comp.id WHERE u.id = ?').get(updated.user_id);

  await sendNotification(
    updated.user_id,
    updated.company_id,
    'Booking Request Rejected',
    `Your booking ${updated.booking_code} for ${cabin ? cabin.name : 'Cabin'} on ${updated.booking_date} (${updated.start_time} - ${updated.end_time}) was REJECTED. Reason: ${rejection_reason}`,
    'REJECTED'
  );

  if (userObj) {
    sendBookingRejectionEmail({
      toEmail: userObj.user_email,
      hrName: userObj.user_name,
      companyName: userObj.company_name,
      bookingCode: updated.booking_code,
      cabinName: cabin ? cabin.name : 'Cabin',
      date: updated.booking_date,
      startTime: updated.start_time,
      endTime: updated.end_time,
      rejectionReason: rejection_reason
    }).catch(err => console.error('Failed sending rejection email:', err));
  }

  return res.json({ message: 'Booking request rejected.', booking: updated });
});

/**
 * POST /api/bookings/:id/cancel
 * Company HR or Admin cancels booking
 */
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  const bookingId = req.params.id;
  const { cancellation_reason } = req.body;

  const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Permission check
  if (req.user.role === 'COMPANY_HR' && booking.company_id !== req.user.company_id) {
    return res.status(403).json({ error: 'Unauthorized to cancel another company’s booking.' });
  }

  // HR Cancellation cutoff policy check (e.g. 30 mins before start)
  if (req.user.role === 'COMPANY_HR') {
    const rules = await db.prepare('SELECT cancellation_cutoff_minutes FROM booking_rules WHERE id = 1').get();
    const cutoffMin = rules ? rules.cancellation_cutoff_minutes : 30;

    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}:00`);
    const now = new Date();
    const diffMins = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (diffMins < cutoffMin && booking.booking_date === now.toISOString().split('T')[0]) {
      return res.status(400).json({
        error: `Cancellation policy restriction: Bookings cannot be cancelled less than ${cutoffMin} minutes before start time.`
      });
    }
  }

  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE bookings
    SET status = 'CANCELLED',
        cancelled_by = ?,
        cancelled_at = ?,
        cancellation_reason = ?,
        updated_at = ?
    WHERE id = ?
  `).run(req.user.id, now, cancellation_reason || 'Cancelled by user', now, bookingId);

  const updated = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

  await createAuditLog(req, 'BOOKING_CANCELLED', 'BOOKING', updated.booking_code, booking.status, 'CANCELLED');

  await sendNotification(
    updated.user_id,
    updated.company_id,
    'Booking Cancelled',
    `Booking ${updated.booking_code} for ${updated.booking_date} (${updated.start_time} - ${updated.end_time}) has been CANCELLED.`,
    'CANCELLED'
  );

  return res.json({ message: 'Booking cancelled successfully.', booking: updated });
});

/**
 * PUT /api/bookings/:id/notes
 * Internal notes by Central Admin
 */
router.put('/:id/notes', authenticateToken, requireRole('CENTRAL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const { internal_notes } = req.body;
  await db.prepare('UPDATE bookings SET internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(internal_notes, req.params.id);
  const updated = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  return res.json({ message: 'Internal notes saved.', booking: updated });
});

module.exports = router;

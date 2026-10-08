const { db } = require('../database/db');

/**
 * Helper to convert "HH:MM" string to total minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Helper to generate human readable booking code e.g. CAB-2026-000009
 */
async function generateBookingCode() {
  const year = new Date().getFullYear();
  const countRow = await db.prepare('SELECT COUNT(*) as count FROM bookings').get();
  const count = countRow ? parseInt(countRow.count) : 0;
  const nextNum = (count + 1).toString().padStart(6, '0');
  return `CAB-${year}-${nextNum}`;
}

/**
 * Check if a time range overlaps with existing bookings
 * Overlap condition: (startA < endB) AND (endA > startB)
 * 
 * @param {number} cabinId 
 * @param {string} date YYYY-MM-DD
 * @param {string} startTime HH:MM
 * @param {string} endTime HH:MM
 * @param {number|null} excludeBookingId Ignore self when modifying
 * @returns {Promise<{hasConflict: boolean, hasConfirmedConflict: boolean, conflictingBookings: Array}>}
 */
async function checkBookingConflict(cabinId, date, startTime, endTime, excludeBookingId = null) {
  let query = `
    SELECT b.id, b.booking_code, b.start_time, b.end_time, b.status, c.name as company_name
    FROM bookings b
    JOIN companies c ON b.company_id = c.id
    WHERE b.cabin_id = ?
      AND b.booking_date = ?
      AND b.status IN ('CONFIRMED', 'PENDING')
      AND (b.start_time < ? AND b.end_time > ?)
  `;
  const params = [cabinId, date, endTime, startTime];

  if (excludeBookingId) {
    query += ` AND b.id != ?`;
    params.push(excludeBookingId);
  }

  const conflicting = await db.prepare(query).all(...params);

  // Separate confirmed vs pending conflicts
  const confirmedConflicts = conflicting.filter(b => b.status === 'CONFIRMED');

  return {
    hasConflict: conflicting.length > 0,
    hasConfirmedConflict: confirmedConflicts.length > 0,
    conflictingBookings: conflicting
  };
}

/**
 * Validate a booking request against system rules
 */
async function validateBookingRules(cabinId, bookingDate, startTime, endTime) {
  // Fetch system rules
  const rules = await db.prepare('SELECT * FROM booking_rules WHERE id = 1').get();

  // 1. Verify cabin exists and is available
  const cabin = await db.prepare('SELECT status, name FROM cabins WHERE id = ?').get(cabinId);
  if (!cabin) {
    return { valid: false, error: 'Selected cabin does not exist.' };
  }
  if (cabin.status === 'MAINTENANCE') {
    return { valid: false, error: `${cabin.name} is currently under maintenance.` };
  }
  if (cabin.status === 'INACTIVE') {
    return { valid: false, error: `${cabin.name} is inactive and unavailable for booking.` };
  }

  // 2. Validate time format & logic
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (endMin <= startMin) {
    return { valid: false, error: 'End time must be after start time.' };
  }

  const durationMin = endMin - startMin;

  // 3. Validate min/max duration
  const minDurationAllowed = Math.min(rules.min_duration_minutes || 15, 15);
  if (durationMin < minDurationAllowed) {
    return { valid: false, error: `Minimum booking duration is ${minDurationAllowed} minutes.` };
  }
  if (durationMin > rules.max_duration_minutes) {
    return { valid: false, error: `Maximum booking duration is ${rules.max_duration_minutes / 60} hours (${rules.max_duration_minutes} mins).` };
  }

  // 4. Validate time step increments (15 minutes)
  if (startMin % 15 !== 0 || endMin % 15 !== 0) {
    return { valid: false, error: `Start and end times must be in 15-minute increments.` };
  }

  // 5. Validate Office Hours
  const officeStartMin = timeToMinutes(rules.office_start_time);
  const officeEndMin = timeToMinutes(rules.office_end_time);

  if (startMin < officeStartMin || endMin > officeEndMin) {
    return {
      valid: false,
      error: `Bookings are only permitted during office hours (${rules.office_start_time} - ${rules.office_end_time}).`
    };
  }

  // 6. Validate 7-day advance booking window & past date/time
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const maxDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const maxYear = maxDateObj.getFullYear();
  const maxMonth = String(maxDateObj.getMonth() + 1).padStart(2, '0');
  const maxDay = String(maxDateObj.getDate()).padStart(2, '0');
  const maxDateStr = `${maxYear}-${maxMonth}-${maxDay}`;

  if (bookingDate < todayStr) {
    return { valid: false, error: 'Cannot create bookings for past dates.' };
  }

  if (bookingDate > maxDateStr) {
    return { valid: false, error: `Advance booking restriction: Bookings can only be reserved up to 1 week (7 days) in advance (until ${maxDateStr}).` };
  }

  if (bookingDate === todayStr) {
    const currentMin = now.getHours() * 60 + now.getMinutes();
    if (startMin < currentMin) {
      return { valid: false, error: 'Cannot create bookings for a past time today.' };
    }
  }

  return { valid: true, rules };
}

module.exports = {
  timeToMinutes,
  generateBookingCode,
  checkBookingConflict,
  validateBookingRules
};

const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { timeToMinutes } = require('../services/bookingValidation');

/**
 * GET /api/reports/summary
 * Central Admin & Super Admin dashboard metrics and chart analytics
 */
router.get('/summary', authenticateToken, requireRole('CENTRAL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Overview counts
  const totalBookingsRes = await db.prepare('SELECT COUNT(*) as count FROM bookings').get();
  const totalBookings = parseInt(totalBookingsRes ? totalBookingsRes.count : 0);

  const todayBookingsRes = await db.prepare('SELECT COUNT(*) as count FROM bookings WHERE booking_date = ?').get(todayStr);
  const todayBookings = parseInt(todayBookingsRes ? todayBookingsRes.count : 0);

  const pendingRequestsRes = await db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'PENDING'").get();
  const pendingRequests = parseInt(pendingRequestsRes ? pendingRequestsRes.count : 0);

  const confirmedTodayRes = await db.prepare("SELECT COUNT(*) as count FROM bookings WHERE booking_date = ? AND status = 'CONFIRMED'").get(todayStr);
  const confirmedToday = parseInt(confirmedTodayRes ? confirmedTodayRes.count : 0);

  const totalCompaniesRes = await db.prepare("SELECT COUNT(*) as count FROM companies WHERE status = 'ACTIVE'").get();
  const totalCompanies = parseInt(totalCompaniesRes ? totalCompaniesRes.count : 0);

  const totalCabinsRes = await db.prepare("SELECT COUNT(*) as count FROM cabins WHERE status = 'AVAILABLE'").get();
  const totalCabins = parseInt(totalCabinsRes ? totalCabinsRes.count : 0);

  // Calculate today's currently available cabins right now
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const cabins = await db.prepare("SELECT id FROM cabins WHERE status = 'AVAILABLE'").all();
  let availableCabinsRightNow = 0;

  for (const c of cabins) {
    const todayConfirmedBookings = await db.prepare(`
      SELECT id, start_time, end_time FROM bookings
      WHERE cabin_id = ? AND booking_date = ? AND status = 'CONFIRMED'
    `).all(c.id, todayStr);

    const activeBooking = todayConfirmedBookings.find(b => {
      const s = timeToMinutes(b.start_time);
      const e = timeToMinutes(b.end_time);
      return currentMin >= s && currentMin < e;
    });

    if (!activeBooking) {
      availableCabinsRightNow++;
    }
  }

  // 2. Bookings by Status Distribution
  const statusStats = await db.prepare(`
    SELECT status, COUNT(*) as count
    FROM bookings
    GROUP BY status
  `).all();

  // 3. Bookings by Cabin Usage
  const cabinStats = await db.prepare(`
    SELECT c.name as cabin_name, COUNT(b.id) as booking_count
    FROM cabins c
    LEFT JOIN bookings b ON b.cabin_id = c.id
    GROUP BY c.id, c.name
  `).all();

  // 4. Top Companies by Booking Volume
  const companyStats = await db.prepare(`
    SELECT comp.name as company_name, COUNT(b.id) as booking_count
    FROM companies comp
    JOIN bookings b ON b.company_id = comp.id
    GROUP BY comp.id, comp.name
    ORDER BY booking_count DESC
    LIMIT 10
  `).all();

  return res.json({
    metrics: {
      totalBookings,
      todayBookings,
      pendingRequests,
      confirmedToday,
      totalCompanies,
      totalCabins,
      availableCabinsRightNow
    },
    statusStats: statusStats.map(s => ({ ...s, count: parseInt(s.count) })),
    cabinStats: cabinStats.map(c => ({ ...c, booking_count: parseInt(c.booking_count) })),
    companyStats: companyStats.map(c => ({ ...c, booking_count: parseInt(c.booking_count) }))
  });
});

/**
 * GET /api/reports/export-csv
 * Download CSV report of all bookings
 */
router.get('/export-csv', authenticateToken, requireRole('CENTRAL_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const bookings = await db.prepare(`
    SELECT b.booking_code, comp.name as company, u.name as user_name, c.name as cabin,
           b.booking_date, b.start_time, b.end_time, b.purpose, b.people_count, b.status,
           b.created_at
    FROM bookings b
    JOIN companies comp ON b.company_id = comp.id
    JOIN users u ON b.user_id = u.id
    JOIN cabins c ON b.cabin_id = c.id
    ORDER BY b.booking_date DESC
  `).all();

  // Build CSV content
  const headers = ['Booking ID', 'Company', 'Requested By', 'Cabin', 'Date', 'Start Time', 'End Time', 'Purpose', 'People', 'Status', 'Submitted At'];
  const csvRows = [headers.join(',')];

  bookings.forEach(b => {
    const row = [
      `"${b.booking_code}"`,
      `"${(b.company || '').replace(/"/g, '""')}"`,
      `"${(b.user_name || '').replace(/"/g, '""')}"`,
      `"${b.cabin}"`,
      `"${b.booking_date}"`,
      `"${b.start_time}"`,
      `"${b.end_time}"`,
      `"${(b.purpose || '').replace(/"/g, '""')}"`,
      b.people_count,
      `"${b.status}"`,
      `"${b.created_at}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvData = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=cabin_bookings_report_${new Date().toISOString().split('T')[0]}.csv`);
  return res.status(200).send(csvData);
});

module.exports = router;

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database/db');

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const cabinRoutes = require('./routes/cabins');
const companyRoutes = require('./routes/companies');
const userRoutes = require('./routes/users');
const ruleRoutes = require('./routes/rules');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cabins', cabinRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'Cabin Booking System API', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database schema and start server
initDatabase().then(() => {
  const { db } = require('./database/db');

  // Daily audit log cleanup (removes audit logs older than 30 days)
  const cleanAuditLogs = () => {
    db.exec(`DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days'`)
      .then(() => console.log('🧹 Daily Audit Trail maintenance: Records older than 30 days pruned.'))
      .catch(err => console.error('Audit pruning error:', err.message));
  };

  cleanAuditLogs(); // Run on startup
  setInterval(cleanAuditLogs, 24 * 60 * 60 * 1000); // Run every 24 hours

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cabin Booking System Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database on startup:', err);
  process.exit(1);
});

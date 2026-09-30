const bcrypt = require('bcryptjs');
const { pool, db } = require('./db');

async function cleanDatabase() {
  console.log('🧹 Clearing all database tables in PostgreSQL...');

  try {
    await pool.query(`
      TRUNCATE notifications, audit_logs, bookings, users, companies RESTART IDENTITY CASCADE;
    `);

    // Ensure default booking_rules row exists
    await pool.query(`
      INSERT INTO booking_rules (id, min_duration_minutes, max_duration_minutes, step_minutes, allow_auto_approval, cancellation_cutoff_minutes, office_start_time, office_end_time, operating_days)
      VALUES (1, 30, 120, 30, 0, 30, '09:00', '18:00', 'Mon,Tue,Wed,Thu,Fri')
      ON CONFLICT (id) DO NOTHING;
    `);

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'irfan@thestartuppark.com';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'test@spxirff';
    const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);

    // 1. Primary Super Admin
    await db.prepare(`
      INSERT INTO users (id, company_id, name, email, password_hash, role, status)
      VALUES (1, NULL, 'Irfan', ?, ?, 'SUPER_ADMIN', 'ACTIVE')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `).run(adminEmail, adminPasswordHash);

    // Insert initial Audit Log
    await db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, role, action, target_type, target_id, new_value, ip_address)
      VALUES (1, 'Irfan', 'SUPER_ADMIN', 'SYSTEM_RESET', 'SYSTEM', 'SYS-01', 'Database cleared. Primary Super Admin initialized.', '127.0.0.1')
    `).run();

    console.log('✅ Successfully cleared PostgreSQL database!');
    console.log(`🔑 Super Admin account created: ${adminEmail} / ${adminPassword}`);
  } catch (err) {
    console.error('❌ Error cleaning database:', err);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  cleanDatabase();
}

module.exports = { cleanDatabase };

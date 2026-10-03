const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const bcrypt = require('bcryptjs');
const { pool, db, initDatabase } = require('./db');

async function seedDatabase() {
  console.log('🌱 Seeding PostgreSQL database...');

  try {
    // 0. Initialize schema tables if they don't exist
    await initDatabase();

    // 1. Ensure booking rules
    await pool.query(`
      INSERT INTO booking_rules (id, min_duration_minutes, max_duration_minutes, step_minutes, allow_auto_approval, cancellation_cutoff_minutes, office_start_time, office_end_time, operating_days)
      VALUES (1, 30, 120, 30, 0, 30, '09:00', '18:00', 'Mon,Tue,Wed,Thu,Fri')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Super Admin
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'irfan@thestartuppark.com';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'test@spxirff';
    const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);

    await db.prepare(`
      INSERT INTO users (id, company_id, name, email, password_hash, role, status)
      VALUES (1, NULL, 'Irfan', ?, ?, 'SUPER_ADMIN', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING;
    `).run(adminEmail, adminPasswordHash);

    // 3. Initial Cabins
    const defaultCabins = [
      { name: 'Executive Suite A', location: 'Floor 1, Wing A', capacity: 12, description: 'High-level executive meeting room with video conferencing.', amenities: JSON.stringify(['Projector', 'Video Conf', 'Whiteboard', 'Air Conditioning']) },
      { name: 'Innovation Hub', location: 'Floor 2, Wing B', capacity: 8, description: 'Creative brainstorming cabin equipped with smart TV.', amenities: JSON.stringify(['Smart TV', 'Whiteboard', 'Coffee Machine']) },
      { name: 'Boardroom One', location: 'Floor 3, Executive Tower', capacity: 20, description: 'Large capacity boardroom for company presentations and key meetings.', amenities: JSON.stringify(['Projector', 'Sound System', 'Video Conf', 'Whiteboard']) }
    ];

    for (const c of defaultCabins) {
      await db.prepare(`
        INSERT INTO cabins (name, location, capacity, description, amenities)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (name) DO NOTHING;
      `).run(c.name, c.location, c.capacity, c.description, c.amenities);
    }

    console.log('✅ PostgreSQL Database seeding completed.');
    console.log(`🔑 Super Admin Account: ${adminEmail}`);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

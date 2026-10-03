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
      VALUES (1, 30, 120, 30, 0, 30, '09:00', '18:00', 'Mon,Tue,Wed,Thu,Fri,Sat')
      ON CONFLICT (id) DO UPDATE SET operating_days = EXCLUDED.operating_days;
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

    // 3. Configured Cabins
    const defaultCabins = [
      { name: 'DUBAI', location: 'Floor 3', capacity: 12, description: 'High-level executive meeting room .', amenities: JSON.stringify(['Whiteboard', 'Air Conditioning']), image_url: null },
      { name: 'PARIS', location: 'Floor 3', capacity: 6, description: 'Meeting Room', amenities: JSON.stringify(['Whiteboard', 'Air Conditioning']), image_url: null },
      { name: 'Training Room 1', location: 'Floor 3', capacity: 20, description: 'Large capacity space for company presentations and key meetings.', amenities: JSON.stringify(['Projector', 'Smart Tv', 'Whiteboard', 'Air Conditioning']), image_url: null },
      { name: 'Training Room 2', location: 'Floor 3', capacity: 35, description: 'High Tech Conference Space ', amenities: JSON.stringify(['Whiteboard', 'Air Conditioning', 'Projector']), image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' }
    ];

    for (const c of defaultCabins) {
      await db.prepare(`
        INSERT INTO cabins (name, location, capacity, description, amenities, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (name) DO UPDATE SET
          location = EXCLUDED.location,
          capacity = EXCLUDED.capacity,
          description = EXCLUDED.description,
          amenities = EXCLUDED.amenities,
          image_url = EXCLUDED.image_url;
      `).run(c.name, c.location, c.capacity, c.description, c.amenities, c.image_url);
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

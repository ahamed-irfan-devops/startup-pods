const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.POSTGRES_USER || 'booking_admin'}:${process.env.POSTGRES_PASSWORD || 'CHANGE_THIS_PASSWORD'}@${process.env.POSTGRES_HOST || 'postgres'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'booking_system'}`;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Converts SQLite-style '?' placeholders to PostgreSQL '$1', '$2', ...
 * Also converts SQLite LIKE / INSERT OR IGNORE syntax if present.
 */
function convertSql(sql) {
  let paramIndex = 1;
  let converted = sql.replace(/\?/g, () => `$${paramIndex++}`);
  
  // Convert SQLite LIKE -> PostgreSQL ILIKE for case-insensitivity
  converted = converted.replace(/\bLIKE\b/gi, 'ILIKE');
  
  // Convert INSERT OR IGNORE INTO -> INSERT INTO ... ON CONFLICT DO NOTHING
  if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(converted)) {
    converted = converted.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
    if (!/ON\s+CONFLICT/i.test(converted)) {
      converted += ' ON CONFLICT DO NOTHING';
    }
  }

  return converted;
}

/**
 * Prepared statement emulator for async execution against PostgreSQL
 */
function prepare(sql) {
  const convertedSql = convertSql(sql);

  return {
    async get(...params) {
      const flatParams = params.flat();
      const res = await pool.query(convertedSql, flatParams);
      return res.rows[0];
    },
    async all(...params) {
      const flatParams = params.flat();
      const res = await pool.query(convertedSql, flatParams);
      return res.rows;
    },
    async run(...params) {
      const flatParams = params.flat();
      let querySql = convertedSql;
      
      // If INSERT and doesn't have RETURNING, append RETURNING id to get lastInsertRowid
      if (/^\s*INSERT\s+/i.test(querySql) && !/RETURNING/i.test(querySql)) {
        querySql += ' RETURNING id';
      }
      
      const res = await pool.query(querySql, flatParams);
      return {
        changes: res.rowCount,
        lastInsertRowid: res.rows[0] ? res.rows[0].id : null,
        rows: res.rows
      };
    }
  };
}

/**
 * Execute a callback inside a PostgreSQL transaction block
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create transaction-bound DB object
    const txDb = {
      prepare(sql) {
        const convertedSql = convertSql(sql);
        return {
          async get(...params) {
            const flatParams = params.flat();
            const res = await client.query(convertedSql, flatParams);
            return res.rows[0];
          },
          async all(...params) {
            const flatParams = params.flat();
            const res = await client.query(convertedSql, flatParams);
            return res.rows;
          },
          async run(...params) {
            const flatParams = params.flat();
            let querySql = convertedSql;
            if (/^\s*INSERT\s+/i.test(querySql) && !/RETURNING/i.test(querySql)) {
              querySql += ' RETURNING id';
            }
            const res = await client.query(querySql, flatParams);
            return {
              changes: res.rowCount,
              lastInsertRowid: res.rows[0] ? res.rows[0].id : null,
              rows: res.rows
            };
          }
        };
      },
      async exec(sql) {
        return client.query(sql);
      }
    };

    const result = await fn(txDb);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Initialize Schema on startup safely
 */
async function initDatabase() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    
    // Ensure default booking_rules row exists
    await pool.query(`
      INSERT INTO booking_rules (id, min_duration_minutes, max_duration_minutes, step_minutes, allow_auto_approval, cancellation_cutoff_minutes, office_start_time, office_end_time, operating_days)
      VALUES (1, 30, 120, 30, 0, 30, '09:00', '18:00', 'Mon,Tue,Wed,Thu,Fri')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ PostgreSQL Schema initialized successfully.');
  } catch (err) {
    console.error('❌ PostgreSQL Schema initialization error:', err);
  }
}

module.exports = {
  pool,
  db: {
    prepare,
    async exec(sql) {
      return pool.query(sql);
    }
  },
  withTransaction,
  initDatabase
};

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Initialize PostgreSQL connection pool
// Railway provides DATABASE_URL automatically
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Test connection and initialize database
pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database.');
    client.release();
    initDatabase();
  })
  .catch(err => {
    console.error('Error connecting to database:', err.message);
  });

// Create tables if they don't exist
async function initDatabase() {
  const createRSVPTableSQL = `
    CREATE TABLE IF NOT EXISTS rsvp_responses (
      id SERIAL PRIMARY KEY,
      guest_name TEXT NOT NULL,
      dinner_choice TEXT NOT NULL,
      email TEXT,
      comments TEXT,
      group_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createInviteesTableSQL = `
    CREATE TABLE IF NOT EXISTS invitees (
      id SERIAL PRIMARY KEY,
      name_normalized TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(createRSVPTableSQL);
    console.log('RSVP responses table ready.');

    await pool.query(createInviteesTableSQL);
    console.log('Invitees table ready.');
  } catch (err) {
    console.error('Error creating tables:', err.message);
  }
}

// Insert RSVP response
async function insertRSVP(guests, email, comments, callback) {
  const groupId = uuidv4();
  const insertSQL = `
    INSERT INTO rsvp_responses (guest_name, dinner_choice, email, comments, group_id)
    VALUES ($1, $2, $3, $4, $5)
  `;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const guest of guests) {
      await client.query(insertSQL, [
        guest.name,
        guest.dinner,
        email || null,
        comments || null,
        groupId
      ]);
    }

    await client.query('COMMIT');

    callback(null, {
      success: true,
      groupId: groupId,
      guestCount: guests.length
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting RSVP:', err.message);
    callback(err, null);
  } finally {
    client.release();
  }
}

// Get all RSVPs
async function getAllRSVPs(callback) {
  const selectSQL = `
    SELECT * FROM rsvp_responses
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(selectSQL);
    callback(null, result.rows);
  } catch (err) {
    console.error('Error fetching RSVPs:', err.message);
    callback(err, null);
  }
}

// Get RSVPs by group ID
async function getRSVPsByGroupId(groupId, callback) {
  const selectSQL = `
    SELECT * FROM rsvp_responses
    WHERE group_id = $1
    ORDER BY id ASC
  `;

  try {
    const result = await pool.query(selectSQL, [groupId]);
    callback(null, result.rows);
  } catch (err) {
    console.error('Error fetching RSVPs by group:', err.message);
    callback(err, null);
  }
}

// Get RSVP statistics
async function getRSVPStats(callback) {
  const statsSQL = `
    SELECT
      COUNT(*) as total_guests,
      COUNT(DISTINCT group_id) as total_parties,
      SUM(CASE WHEN dinner_choice = 'vegetarian' THEN 1 ELSE 0 END) as vegetarian_count,
      SUM(CASE WHEN dinner_choice = 'fish' THEN 1 ELSE 0 END) as fish_count,
      SUM(CASE WHEN dinner_choice = 'meat' THEN 1 ELSE 0 END) as meat_count
    FROM rsvp_responses
  `;

  try {
    const result = await pool.query(statsSQL);
    callback(null, result.rows[0]);
  } catch (err) {
    console.error('Error fetching stats:', err.message);
    callback(err, null);
  }
}

// ============================================================
// INVITEE MANAGEMENT FUNCTIONS
// ============================================================

// Insert new invitee with normalized name
async function insertInvitee(nameNormalized, callback) {
  const insertSQL = `
    INSERT INTO invitees (name_normalized)
    VALUES ($1)
    RETURNING id
  `;

  try {
    const result = await pool.query(insertSQL, [nameNormalized]);
    callback(null, {
      success: true,
      id: result.rows[0].id
    });
  } catch (err) {
    console.error('Error inserting invitee:', err.message);
    callback(err, null);
  }
}

// Get all normalized names for validation
async function getAllInviteesNormalized(callback) {
  const selectSQL = `
    SELECT id, name_normalized
    FROM invitees
    ORDER BY name_normalized ASC
  `;

  try {
    const result = await pool.query(selectSQL);
    callback(null, result.rows);
  } catch (err) {
    console.error('Error fetching invitees:', err.message);
    callback(err, null);
  }
}

// Get invitee count
async function getInviteeCount(callback) {
  const countSQL = `
    SELECT COUNT(*) as count
    FROM invitees
  `;

  try {
    const result = await pool.query(countSQL);
    callback(null, parseInt(result.rows[0].count));
  } catch (err) {
    console.error('Error counting invitees:', err.message);
    callback(err, null);
  }
}

// Delete all invitees (dangerous - admin only)
async function deleteAllInvitees(callback) {
  const deleteSQL = `DELETE FROM invitees`;

  try {
    const result = await pool.query(deleteSQL);
    callback(null, {
      success: true,
      deleted: result.rowCount
    });
  } catch (err) {
    console.error('Error deleting invitees:', err.message);
    callback(err, null);
  }
}

// Close database connection pool
function closeDatabase() {
  pool.end()
    .then(() => console.log('Database connection pool closed.'))
    .catch(err => console.error('Error closing database:', err.message));
}

// Export functions
module.exports = {
  pool,
  insertRSVP,
  getAllRSVPs,
  getRSVPsByGroupId,
  getRSVPStats,
  insertInvitee,
  getAllInviteesNormalized,
  getInviteeCount,
  deleteAllInvitees,
  closeDatabase
};

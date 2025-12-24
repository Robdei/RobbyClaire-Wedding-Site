const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Database file path (in parent directory)
const DB_PATH = path.join(__dirname, '..', 'wedding.db');

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the wedding SQLite database.');
    initDatabase();
  }
});

// Create tables if they don't exist
function initDatabase() {
  // RSVP Responses Table
  const createRSVPTableSQL = `
    CREATE TABLE IF NOT EXISTS rsvp_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      dinner_choice TEXT NOT NULL,
      email TEXT,
      comments TEXT,
      group_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Invitees Table - stores normalized names of approved guests
  const createInviteesTableSQL = `
    CREATE TABLE IF NOT EXISTS invitees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_normalized TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createRSVPTableSQL, (err) => {
    if (err) {
      console.error('Error creating RSVP table:', err.message);
    } else {
      console.log('RSVP responses table ready.');
    }
  });

  db.run(createInviteesTableSQL, (err) => {
    if (err) {
      console.error('Error creating invitees table:', err.message);
    } else {
      console.log('Invitees table ready.');
    }
  });
}

// Insert RSVP response
function insertRSVP(guests, email, comments, callback) {
  const groupId = uuidv4();
  const insertSQL = `
    INSERT INTO rsvp_responses (guest_name, dinner_choice, email, comments, group_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  // Prepare statement for multiple inserts
  const stmt = db.prepare(insertSQL);

  let completed = 0;
  let errors = [];

  guests.forEach((guest, index) => {
    stmt.run(
      guest.name,
      guest.dinner,
      email || null,
      comments || null,
      groupId,
      function(err) {
        if (err) {
          console.error(`Error inserting guest ${index + 1}:`, err.message);
          errors.push(err);
        }

        completed++;

        // Check if all guests have been processed
        if (completed === guests.length) {
          stmt.finalize();

          if (errors.length > 0) {
            callback(errors[0], null);
          } else {
            callback(null, {
              success: true,
              groupId: groupId,
              guestCount: guests.length
            });
          }
        }
      }
    );
  });
}

// Get all RSVPs
function getAllRSVPs(callback) {
  const selectSQL = `
    SELECT * FROM rsvp_responses
    ORDER BY created_at DESC
  `;

  db.all(selectSQL, [], (err, rows) => {
    if (err) {
      console.error('Error fetching RSVPs:', err.message);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// Get RSVPs by group ID
function getRSVPsByGroupId(groupId, callback) {
  const selectSQL = `
    SELECT * FROM rsvp_responses
    WHERE group_id = ?
    ORDER BY id ASC
  `;

  db.all(selectSQL, [groupId], (err, rows) => {
    if (err) {
      console.error('Error fetching RSVPs by group:', err.message);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// Get RSVP statistics
function getRSVPStats(callback) {
  const statsSQL = `
    SELECT
      COUNT(*) as total_guests,
      COUNT(DISTINCT group_id) as total_parties,
      SUM(CASE WHEN dinner_choice = 'vegetarian' THEN 1 ELSE 0 END) as vegetarian_count,
      SUM(CASE WHEN dinner_choice = 'fish' THEN 1 ELSE 0 END) as fish_count,
      SUM(CASE WHEN dinner_choice = 'meat' THEN 1 ELSE 0 END) as meat_count
    FROM rsvp_responses
  `;

  db.get(statsSQL, [], (err, row) => {
    if (err) {
      console.error('Error fetching stats:', err.message);
      callback(err, null);
    } else {
      callback(null, row);
    }
  });
}

// ============================================================
// INVITEE MANAGEMENT FUNCTIONS
// ============================================================

// Insert new invitee with normalized name
function insertInvitee(nameNormalized, callback) {
  const insertSQL = `
    INSERT INTO invitees (name_normalized)
    VALUES (?)
  `;

  db.run(insertSQL, [nameNormalized], function(err) {
    if (err) {
      console.error('Error inserting invitee:', err.message);
      callback(err, null);
    } else {
      callback(null, {
        success: true,
        id: this.lastID
      });
    }
  });
}

// Get all normalized names for validation (no hashes exposed)
function getAllInviteesNormalized(callback) {
  const selectSQL = `
    SELECT id, name_normalized
    FROM invitees
    ORDER BY name_normalized ASC
  `;

  db.all(selectSQL, [], (err, rows) => {
    if (err) {
      console.error('Error fetching invitees:', err.message);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// Get invitee count
function getInviteeCount(callback) {
  const countSQL = `
    SELECT COUNT(*) as count
    FROM invitees
  `;

  db.get(countSQL, [], (err, row) => {
    if (err) {
      console.error('Error counting invitees:', err.message);
      callback(err, null);
    } else {
      callback(null, row.count);
    }
  });
}

// Delete all invitees (dangerous - admin only)
function deleteAllInvitees(callback) {
  const deleteSQL = `DELETE FROM invitees`;

  db.run(deleteSQL, function(err) {
    if (err) {
      console.error('Error deleting invitees:', err.message);
      callback(err, null);
    } else {
      callback(null, {
        success: true,
        deleted: this.changes
      });
    }
  });
}

// Close database connection
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}

// Export functions
module.exports = {
  db,
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

// ============================================================
// CLEAR ALL RSVPS
// ============================================================
// Deletes all entries from the rsvp_responses table
// Usage: node clearRSVPs.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'wedding.db');

console.log('🗑️  Clearing all RSVPs from database...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
});

const deleteSQL = 'DELETE FROM rsvp_responses';

db.run(deleteSQL, function(err) {
  if (err) {
    console.error('❌ Error clearing RSVPs:', err.message);
    db.close();
    process.exit(1);
  } else {
    console.log(`✅ Successfully deleted ${this.changes} RSVP(s)`);
    console.log('RSVP responses table is now empty.\n');

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
      process.exit(0);
    });
  }
});

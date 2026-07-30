// ============================================================
// CLEAR ALL RSVPS
// ============================================================
// Deletes all entries from the rsvp_responses table
// Usage: node clearRSVPs.js

require('dotenv').config();
const { pool, closeDatabase } = require('./database');

console.log('🗑️  Clearing all RSVPs from database...\n');

async function clearRSVPs() {
  try {
    const result = await pool.query('DELETE FROM rsvp_responses');
    console.log(`✅ Successfully deleted ${result.rowCount} RSVP(s)`);
    console.log('RSVP responses table is now empty.\n');
    closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing RSVPs:', err.message);
    closeDatabase();
    process.exit(1);
  }
}

clearRSVPs();

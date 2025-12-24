// ============================================================
// CLEAR ALL INVITEES
// ============================================================
// Deletes all entries from the invitees table
// Usage: node clearInvitees.js

const { deleteAllInvitees, closeDatabase } = require('./database');

console.log('🗑️  Clearing all invitees from database...\n');

deleteAllInvitees((err, result) => {
  if (err) {
    console.error('❌ Error clearing invitees:', err.message);
    closeDatabase();
    process.exit(1);
  } else {
    console.log(`✅ Successfully deleted ${result.deleted} invitee(s)`);
    console.log('Invitees table is now empty.\n');
    closeDatabase();
    process.exit(0);
  }
});

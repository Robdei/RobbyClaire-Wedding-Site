// ============================================================
// LIST ALL INVITEES
// ============================================================
// Displays all invitees currently in the database
// Usage: node listInvitees.js

const { getAllInviteesNormalized, getInviteeCount, closeDatabase } = require('./database');

console.log('📋 Fetching invitees list...\n');

getInviteeCount((err, count) => {
  if (err) {
    console.error('❌ Error getting count:', err.message);
    closeDatabase();
    process.exit(1);
  }

  console.log(`Total invitees: ${count}\n`);

  if (count === 0) {
    console.log('⚠️  No invitees found. The list is empty.');
    closeDatabase();
    process.exit(0);
  }

  getAllInviteesNormalized((err, invitees) => {
    if (err) {
      console.error('❌ Error fetching invitees:', err.message);
      closeDatabase();
      process.exit(1);
    }

    console.log('Invitees (normalized names):');
    console.log('─'.repeat(50));

    invitees.forEach((invitee, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${invitee.name_normalized}`);
    });

    console.log('─'.repeat(50));
    closeDatabase();
    process.exit(0);
  });
});

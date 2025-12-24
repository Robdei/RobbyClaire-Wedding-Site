// ============================================================
// RESET INVITEES TABLE
// ============================================================
// Drops the old invitees table (with hash/salt columns)
// Recreates with new simplified schema (just name_normalized)
// Re-imports names from CSV
//
// Usage: node resetInviteesTable.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { normalizeName } = require('./inviteeManager');

const DB_PATH = path.join(__dirname, '..', 'wedding.db');

console.log('🔄 Starting invitees table reset...\n');

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to database');
});

// Step 1: Drop old table
function dropOldTable() {
  return new Promise((resolve, reject) => {
    const dropSQL = 'DROP TABLE IF EXISTS invitees';

    db.run(dropSQL, (err) => {
      if (err) {
        console.error('❌ Error dropping table:', err.message);
        reject(err);
      } else {
        console.log('✓ Dropped old invitees table');
        resolve();
      }
    });
  });
}

// Step 2: Create new simplified table
function createNewTable() {
  return new Promise((resolve, reject) => {
    const createSQL = `
      CREATE TABLE invitees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_normalized TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createSQL, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err.message);
        reject(err);
      } else {
        console.log('✓ Created new invitees table (simplified schema)');
        resolve();
      }
    });
  });
}

// Step 3: Import names from CSV
function importNamesFromCSV() {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(__dirname, '..', 'acceptable-names-fixed.csv');

    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file not found: ${csvPath}`));
      return;
    }

    console.log(`✓ Reading CSV: ${csvPath}\n`);

    const insertSQL = 'INSERT INTO invitees (name_normalized) VALUES (?)';
    const stmt = db.prepare(insertSQL);

    let importCount = 0;
    let errorCount = 0;
    const errors = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const name = row.name || row.Name;

        if (!name || name.trim() === '') {
          errorCount++;
          errors.push('Empty name field');
          return;
        }

        const normalized = normalizeName(name);

        stmt.run(normalized, function(err) {
          if (err) {
            errorCount++;
            errors.push(`${name}: ${err.message}`);
          } else {
            importCount++;
            console.log(`  ✓ Imported: ${name} → ${normalized}`);
          }
        });
      })
      .on('end', () => {
        stmt.finalize(() => {
          console.log(`\n📊 Import Summary:`);
          console.log(`   Successfully imported: ${importCount}`);
          console.log(`   Failed: ${errorCount}`);

          if (errors.length > 0) {
            console.log('\n❌ Errors:');
            errors.forEach(err => console.log(`   - ${err}`));
          }

          resolve({ importCount, errorCount });
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Execute all steps sequentially
async function resetDatabase() {
  try {
    await dropOldTable();
    await createNewTable();
    await importNamesFromCSV();

    console.log('\n✅ Invitees table reset complete!');

    // Close database
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    db.close();
    process.exit(1);
  }
}

// Run the reset
resetDatabase();

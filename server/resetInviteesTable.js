// ============================================================
// RESET INVITEES TABLE
// ============================================================
// Drops the existing invitees table, recreates it with the
// current schema, and re-imports names from a CSV file.
//
// Usage: node resetInviteesTable.js [path/to/names.csv]
//   Defaults to ../acceptable-names-fixed.csv if no path is given.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { normalizeName } = require('./inviteeManager');
const { pool, closeDatabase } = require('./database');

console.log('🔄 Starting invitees table reset...\n');

// Step 1: Drop old table
async function dropOldTable() {
  await pool.query('DROP TABLE IF EXISTS invitees');
  console.log('✓ Dropped old invitees table');
}

// Step 2: Create new table (matches database.js schema)
async function createNewTable() {
  const createSQL = `
    CREATE TABLE invitees (
      id SERIAL PRIMARY KEY,
      name_normalized TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(createSQL);
  console.log('✓ Created new invitees table (simplified schema)');
}

// Step 3: Import names from CSV
function importNamesFromCSV(csvPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file not found: ${csvPath}`));
      return;
    }

    console.log(`✓ Reading CSV: ${csvPath}\n`);

    let importCount = 0;
    let errorCount = 0;
    const errors = [];
    const rowPromises = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const name = row.name || row.Name || row.NAME;

        if (!name || name.trim() === '') {
          errorCount++;
          errors.push('Empty name field');
          return;
        }

        const normalized = normalizeName(name);

        // ON CONFLICT keeps the run idempotent if a name appears twice
        const p = pool
          .query(
            'INSERT INTO invitees (name_normalized) VALUES ($1) ON CONFLICT (name_normalized) DO NOTHING',
            [normalized]
          )
          .then(() => {
            importCount++;
            console.log(`  ✓ Imported: ${name} → ${normalized}`);
          })
          .catch((err) => {
            errorCount++;
            errors.push(`${name}: ${err.message}`);
          });

        rowPromises.push(p);
      })
      .on('end', async () => {
        await Promise.all(rowPromises);

        console.log(`\n📊 Import Summary:`);
        console.log(`   Successfully imported: ${importCount}`);
        console.log(`   Failed: ${errorCount}`);

        if (errors.length > 0) {
          console.log('\n❌ Errors:');
          errors.forEach((err) => console.log(`   - ${err}`));
        }

        resolve({ importCount, errorCount });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Execute all steps sequentially
async function resetDatabase() {
  const csvPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(__dirname, '..', 'acceptable-names-fixed.csv');

  try {
    await dropOldTable();
    await createNewTable();
    await importNamesFromCSV(csvPath);

    console.log('\n✅ Invitees table reset complete!');
    closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    closeDatabase();
    process.exit(1);
  }
}

resetDatabase();

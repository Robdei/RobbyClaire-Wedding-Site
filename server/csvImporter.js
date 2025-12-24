#!/usr/bin/env node
// ============================================================
// CSV INVITEE IMPORTER
// ============================================================
// Imports approved guest names from CSV file into invitees database
// Usage: node csvImporter.js <filename.csv>
//   or: npm run import-invitees <filename.csv>
//
// CSV Format:
//   name
//   John Doe
//   Jane Smith
//   ...

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { addInvitee } = require('./inviteeManager');
const { getInviteeCount, closeDatabase } = require('./database');

// ============================================================
// CSV IMPORT LOGIC
// ============================================================

/**
 * Import invitees from CSV file
 * @param {string} csvFilePath - Path to CSV file
 * @returns {Promise<object>} - Import results
 */
async function importInviteesFromCSV(csvFilePath) {
  return new Promise((resolve, reject) => {
    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
      names: []
    };

    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      return reject(new Error(`File not found: ${csvFilePath}`));
    }

    const stream = fs.createReadStream(csvFilePath)
      .pipe(csv());

    const promises = [];

    stream.on('data', (row) => {
      const name = row.name || row.Name || row.NAME;

      if (!name || !name.trim()) {
        results.failed++;
        results.errors.push({
          row: results.total + 1,
          error: 'Empty or missing name field'
        });
        results.total++;
        return;
      }

      results.total++;

      // Add invitee (returns promise)
      const promise = addInvitee(name)
        .then((result) => {
          results.successful++;
          results.names.push({
            original: name,
            normalized: result.normalized,
            id: result.id
          });
          console.log(`✓ Added: ${name} (normalized: ${result.normalized})`);
        })
        .catch((error) => {
          results.failed++;
          results.errors.push({
            row: results.total,
            name: name,
            error: error.message
          });
          console.error(`✗ Failed: ${name} - ${error.message}`);
        });

      promises.push(promise);
    });

    stream.on('end', async () => {
      // Wait for all promises to complete
      await Promise.all(promises);
      resolve(results);
    });

    stream.on('error', (error) => {
      reject(new Error(`CSV parsing error: ${error.message}`));
    });
  });
}

// ============================================================
// CLI INTERFACE
// ============================================================

async function main() {
  console.log('================================================');
  console.log('  Wedding RSVP - Invitee CSV Importer');
  console.log('================================================\n');

  // Get CSV file path from command line argument
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error('Error: No CSV file specified');
    console.log('\nUsage:');
    console.log('  node csvImporter.js <filename.csv>');
    console.log('  npm run import-invitees <filename.csv>');
    console.log('\nExample:');
    console.log('  npm run import-invitees invitees.csv');
    console.log('\nCSV Format (header required):');
    console.log('  name');
    console.log('  John Doe');
    console.log('  Jane Smith');
    console.log('  ...\n');
    process.exit(1);
  }

  // Resolve full path
  const fullPath = path.resolve(csvFilePath);
  console.log(`Reading CSV file: ${fullPath}\n`);

  try {
    // Import invitees
    const results = await importInviteesFromCSV(fullPath);

    // Print summary
    console.log('\n================================================');
    console.log('  IMPORT SUMMARY');
    console.log('================================================');
    console.log(`Total rows processed: ${results.total}`);
    console.log(`Successfully imported: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`  Row ${err.row}: ${err.error}`);
        if (err.name) {
          console.log(`    Name: ${err.name}`);
        }
      });
    }

    // Get current invitee count
    const totalInvitees = await new Promise((resolve, reject) => {
      getInviteeCount((err, count) => {
        if (err) reject(err);
        else resolve(count);
      });
    });

    console.log(`\nTotal invitees in database: ${totalInvitees}`);
    console.log('================================================\n');

    // Close database connection
    closeDatabase();

    // Exit with error code if any imports failed
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error(`\n✗ Import failed: ${error.message}\n`);
    closeDatabase();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for potential reuse
module.exports = {
  importInviteesFromCSV
};

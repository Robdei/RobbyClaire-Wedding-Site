// ============================================================
// INVITEE MANAGER - Name Normalization & Validation
// ============================================================
// Handles normalization and validation of approved guest names
// Implements 75% fuzzy matching for typo tolerance

require('dotenv').config();
const stringSimilarity = require('string-similarity');
const { insertInvitee, getAllInviteesNormalized } = require('./database');

// Configuration
const FUZZY_MATCH_THRESHOLD = 0.75; // 75% similarity

// ============================================================
// NAME NORMALIZATION
// ============================================================

/**
 * Normalize a name for comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes extra spaces
 * - Removes special characters except hyphens and apostrophes
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')                    // Replace multiple spaces with single space
    .replace(/[^a-z0-9\s\-']/gi, '');        // Keep only letters, numbers, spaces, hyphens, apostrophes
}

// ============================================================
// INVITEE MANAGEMENT
// ============================================================

/**
 * Add a new invitee to the database
 * @param {string} name - Full name of invitee
 * @returns {Promise<object>} - Result object
 */
async function addInvitee(name) {
  try {
    const normalized = normalizeName(name);

    if (!normalized) {
      throw new Error('Invalid name provided');
    }

    return new Promise((resolve, reject) => {
      insertInvitee(normalized, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: true,
            name: name,
            normalized: normalized,
            id: result.id
          });
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to add invitee: ${error.message}`);
  }
}

// ============================================================
// FUZZY MATCHING & VALIDATION
// ============================================================

/**
 * Check if a submitted name fuzzy-matches any invitee
 * Uses 75% similarity threshold
 * @param {string} submittedName - Name from RSVP form
 * @param {Array<object>} inviteeList - Array of {id, name_normalized}
 * @returns {object} - {isMatch: boolean, matchedName: string|null, similarity: number}
 */
function fuzzyMatchName(submittedName, inviteeList) {
  const normalized = normalizeName(submittedName);

  if (!normalized || inviteeList.length === 0) {
    return {
      isMatch: false,
      matchedName: null,
      similarity: 0
    };
  }

  // Get array of normalized names from invitee list
  const targetNames = inviteeList.map(inv => inv.name_normalized);

  // Find best match using string similarity
  const matches = stringSimilarity.findBestMatch(normalized, targetNames);
  const bestMatch = matches.bestMatch;

  const isMatch = bestMatch.rating >= FUZZY_MATCH_THRESHOLD;

  return {
    isMatch: isMatch,
    matchedName: isMatch ? bestMatch.target : null,
    similarity: bestMatch.rating
  };
}

/**
 * Validate that at least one guest name matches the invitee list
 * @param {Array<string>} guestNames - Array of guest names from RSVP submission
 * @returns {Promise<object>} - {isValid: boolean, matchedGuest: string|null, details: object}
 */
async function validateAtLeastOneMatch(guestNames) {
  try {
    // Get all invitees (normalized names only)
    const inviteeList = await new Promise((resolve, reject) => {
      getAllInviteesNormalized((err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (inviteeList.length === 0) {
      console.warn('WARNING: Invitee list is empty. All RSVP submissions will be rejected.');
      return {
        isValid: false,
        matchedGuest: null,
        reason: 'No invitees configured',
        details: {}
      };
    }

    // Check each guest name for a match
    for (const guestName of guestNames) {
      const matchResult = fuzzyMatchName(guestName, inviteeList);

      if (matchResult.isMatch) {
        return {
          isValid: true,
          matchedGuest: guestName,
          matchedInvitee: matchResult.matchedName,
          similarity: matchResult.similarity,
          details: matchResult
        };
      }
    }

    // No matches found
    return {
      isValid: false,
      matchedGuest: null,
      reason: 'No guest names matched invitee list',
      details: {
        attemptedNames: guestNames.map(name => normalizeName(name)),
        threshold: FUZZY_MATCH_THRESHOLD
      }
    };

  } catch (error) {
    console.error('Error validating guest names:', error);
    throw new Error(`Validation error: ${error.message}`);
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  normalizeName,
  addInvitee,
  fuzzyMatchName,
  validateAtLeastOneMatch,
  FUZZY_MATCH_THRESHOLD
};

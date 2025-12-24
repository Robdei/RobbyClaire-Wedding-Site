require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const {
  insertRSVP,
  getAllRSVPs,
  getRSVPsByGroupId,
  getRSVPStats,
  getInviteeCount,
  deleteAllInvitees,
  closeDatabase
} = require('./database');
const { validateAtLeastOneMatch } = require('./inviteeManager');
const { requireAdminAuth } = require('./authMiddleware');
const { importInviteesFromCSV } = require('./csvImporter');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting for RSVP submissions (prevent abuse)
const rsvpRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,  // 5 requests per hour
  message: {
    success: false,
    error: 'Too many RSVP attempts. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many RSVP attempts from this IP address. Please try again in 1 hour.',
      retryAfter: '1 hour'
    });
  }
});

// Multer configuration for CSV file uploads
const upload = multer({
  dest: '/tmp/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Serve static frontend files (for production deployment)
app.use(express.static(path.join(__dirname, '..')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================
// API ENDPOINTS
// ============================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Wedding RSVP server is running',
    timestamp: new Date().toISOString()
  });
});

// Submit RSVP (with rate limiting and invitee validation)
app.post('/api/rsvp', rsvpRateLimiter, async (req, res) => {
  const { guests, email, comments } = req.body;

  // Validation
  if (!guests || !Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one guest is required'
    });
  }

  // Validate each guest
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];

    if (!guest.name || !guest.name.trim()) {
      return res.status(400).json({
        success: false,
        error: `Guest ${i + 1} name is required`
      });
    }

    if (!guest.dinner || !['vegetarian', 'fish', 'meat'].includes(guest.dinner)) {
      return res.status(400).json({
        success: false,
        error: `Guest ${i + 1} must have a valid dinner selection`
      });
    }
  }

  // Validate email if provided
  if (email && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address'
      });
    }
  }

  // ============================================================
  // INVITEE VALIDATION - Check if at least one guest matches invitee list
  // ============================================================
  try {
    const guestNames = guests.map(g => g.name);
    const validationResult = await validateAtLeastOneMatch(guestNames);

    if (!validationResult.isValid) {
      console.log(`❌ RSVP rejected - No invitee match found for: ${guestNames.join(', ')}`);
      return res.status(403).json({
        success: false,
        error: "We couldn't find your name on the guest list. Please check your spelling or contact us at robbyclairegottesman@gmail.com",
        details: validationResult.reason
      });
    }

    console.log(`✓ Invitee validation passed - Matched: ${validationResult.matchedGuest} (${(validationResult.similarity * 100).toFixed(1)}% similarity)`);

  } catch (error) {
    console.error('Invitee validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to validate guest list. Please try again later.'
    });
  }

  // Insert into database
  insertRSVP(guests, email, comments, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to save RSVP. Please try again.'
      });
    }

    console.log(`✅ RSVP submitted successfully - Group: ${result.groupId}, Guests: ${result.guestCount}`);

    res.json({
      success: true,
      message: 'RSVP submitted successfully',
      groupId: result.groupId,
      guestCount: result.guestCount
    });
  });
});

// Get all RSVPs (admin only)
app.get('/api/rsvps', requireAdminAuth, (req, res) => {
  getAllRSVPs((err, rsvps) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch RSVPs'
      });
    }

    res.json({
      success: true,
      count: rsvps.length,
      rsvps: rsvps
    });
  });
});

// Get RSVPs by group ID (admin only)
app.get('/api/rsvps/:groupId', requireAdminAuth, (req, res) => {
  const { groupId } = req.params;

  getRSVPsByGroupId(groupId, (err, rsvps) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch RSVPs'
      });
    }

    if (rsvps.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No RSVPs found for this group'
      });
    }

    res.json({
      success: true,
      count: rsvps.length,
      rsvps: rsvps
    });
  });
});

// Get RSVP statistics (admin only)
app.get('/api/rsvps/stats', requireAdminAuth, (req, res) => {
  getRSVPStats((err, stats) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }

    res.json({
      success: true,
      stats: stats
    });
  });
});

// ============================================================
// ADMIN INVITEE MANAGEMENT ENDPOINTS
// ============================================================

// Get invitee count (admin only)
app.get('/api/admin/invitees/count', requireAdminAuth, (req, res) => {
  getInviteeCount((err, count) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch invitee count'
      });
    }

    res.json({
      success: true,
      count: count
    });
  });
});

// Import invitees from CSV file (admin only)
app.post('/api/admin/invitees/import', requireAdminAuth, upload.single('csv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No CSV file provided'
    });
  }

  try {
    const results = await importInviteesFromCSV(req.file.path);

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'CSV import completed',
      results: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined
      }
    });

  } catch (error) {
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('CSV import error:', error);
    res.status(500).json({
      success: false,
      error: `CSV import failed: ${error.message}`
    });
  }
});

// Delete all invitees (admin only - dangerous!)
app.delete('/api/admin/invitees', requireAdminAuth, (req, res) => {
  // Require confirmation parameter
  const { confirm } = req.query;

  if (confirm !== 'DELETE_ALL') {
    return res.status(400).json({
      success: false,
      error: 'Missing confirmation. Add ?confirm=DELETE_ALL to proceed.'
    });
  }

  deleteAllInvitees((err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete invitees'
      });
    }

    console.log(`⚠️  All invitees deleted (${result.deleted} rows)`);

    res.json({
      success: true,
      message: 'All invitees deleted',
      deleted: result.deleted
    });
  });
});

// SPA fallback - serve index.html for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🍷 Wedding RSVP Server Running (Secure Mode)               ║
║                                                               ║
║   Port: ${PORT}                                                ║
║   URL: http://localhost:${PORT}                                ║
║                                                               ║
║   PUBLIC ENDPOINTS:                                           ║
║   - POST /api/rsvp              (Submit RSVP - rate limited) ║
║   - GET  /api/health            (Health check)               ║
║                                                               ║
║   ADMIN ENDPOINTS (require API key):                          ║
║   - GET  /api/rsvps                 (Get all RSVPs)          ║
║   - GET  /api/rsvps/:id             (Get by group ID)        ║
║   - GET  /api/rsvps/stats           (Get statistics)         ║
║   - GET  /api/admin/invitees/count  (Get invitee count)      ║
║   - POST /api/admin/invitees/import (Import CSV)             ║
║   - DEL  /api/admin/invitees        (Delete all invitees)    ║
║                                                               ║
║   SECURITY FEATURES:                                          ║
║   ✓ Invitee validation (75% fuzzy matching)                  ║
║   ✓ Rate limiting (5 requests/hour)                          ║
║   ✓ Admin authentication (Bearer token)                      ║
║   ✓ Hashed & salted invitee names                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  closeDatabase();
  process.exit(0);
});

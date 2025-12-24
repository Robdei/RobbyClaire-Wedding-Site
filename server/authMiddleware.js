// ============================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ============================================================
// Protects admin endpoints with API key authentication
// Requires Authorization header: Bearer <ADMIN_API_KEY>

require('dotenv').config();

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('FATAL ERROR: ADMIN_API_KEY environment variable not set');
  console.error('Admin endpoints will not be accessible until this is configured.');
}

/**
 * Middleware to require admin authentication
 * Checks for valid API key in Authorization header
 */
function requireAdminAuth(req, res, next) {
  // Get authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header'
    });
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <token>'
    });
  }

  const token = parts[1];

  // Verify token matches admin API key
  if (token !== ADMIN_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  // Authentication successful
  console.log(`[AUTH] Admin access granted for ${req.method} ${req.path}`);
  next();
}

/**
 * Optional authentication - allows access but logs if authenticated
 * Useful for endpoints that should be public but benefit from knowing if admin is accessing
 */
function optionalAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1] === ADMIN_API_KEY) {
      req.isAdmin = true;
      console.log(`[AUTH] Admin authenticated for ${req.method} ${req.path}`);
    }
  }

  next();
}

module.exports = {
  requireAdminAuth,
  optionalAdminAuth
};

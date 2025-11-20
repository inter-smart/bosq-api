const jwt = require('jsonwebtoken');
const { sendUnauthorizedError } = require('../traits/responseHandler');

module.exports = (roles = []) => {
  return async (req, res, next) => {
    // Skip processing during module loading (no valid req/res)
    if (!req || !res || typeof res.status !== 'function') {
      return next();
    }

    try {
      // Get token from Authorization header or cookie
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.jwt;
      if (!token) {
        return sendUnauthorizedError(res, 'Authorization token required');
      }

      // Check blacklist (optional)
      const redisClient = req.app.get('redisClient');
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return sendUnauthorizedError(res, 'Token is blacklisted');
        }
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

      // Check role
      if (roles.length && !roles.includes(decoded.role)) {
        return sendUnauthorizedError(res, 'Insufficient permissions');
      }

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Auth middleware error:', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return sendUnauthorizedError(res, error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
    }
  };
};
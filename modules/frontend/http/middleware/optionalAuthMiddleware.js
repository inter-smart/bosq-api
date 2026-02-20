const jwt = require("jsonwebtoken");

/**
 * Optional authentication middleware
 * Attaches user info to req.auth if valid token is provided
 * Does NOT reject requests without token - allows guest access
 */
const optionalAuth = () => {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.access_token;

      if (!token) {
        return next(); // guest request
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.auth = decoded;

      next();
    } catch (error) {
      req.auth = null;
      next();
    }
  };
};

module.exports = { optionalAuth };

const jwt = require("jsonwebtoken");
const { sendUnauthorizedError } = require("../traits/responseHandler");

module.exports = (roles = []) => {
  return async (req, res, next) => {
    // Skip processing during module loading (no valid req/res)
    if (!req || !res || typeof res.status !== "function") {
      return next();
    }

    try {
      // Get token from Authorization header or cookie
      const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
      if (!token) {
        console.warn(`[AdminAuthMiddleware] No token found in request to ${req.originalUrl}`);
        return sendUnauthorizedError(res, "Authorization token required");
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check role
      if (roles.length && !roles.includes(decoded.role)) {
        console.warn(`[AdminAuthMiddleware] Insufficient permissions for ${decoded.email} on ${req.originalUrl}. Required: ${roles}, Has: ${decoded.role}`);
        return sendUnauthorizedError(res, "Insufficient permissions");
      }

      req.user = decoded;
      console.log(`[AdminAuthMiddleware] Token verified for admin ${decoded.email} on ${req.originalUrl}`);
      next();
    } catch (error) {
      console.error(`[AdminAuthMiddleware] Auth error on ${req.originalUrl}:`, {
        name: error.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return sendUnauthorizedError(res, error.name === "TokenExpiredError" ? "Token expired" : "Invalid token");
    }
  };
};

import jwt from "jsonwebtoken";

/**
 * Optional authentication middleware
 * Attaches user info to req.auth if valid token is provided
 * Does NOT reject requests without token - allows guest access
 */
export const optionalAuth = () => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1] || req.cookies?.access_token;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.auth = decoded;
        } catch (error) {
          // Token invalid or expired - continue as guest
          req.auth = null;
        }
      } else {
        req.auth = null;
      }

      next();
    } catch (error) {
      // On any error, continue as guest
      req.auth = null;
      next();
    }
  };
};

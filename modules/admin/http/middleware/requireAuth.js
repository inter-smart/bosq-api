const jwt = require("jsonwebtoken");
const { sendUnauthorizedError } = require("../traits/responseHandler");

// Plain "must be logged in" check -- no module/permission requirement.
// Used for routes any authenticated admin (regardless of role) may call,
// e.g. change-password, or generic lookup helpers shared across modules.
module.exports = () => {
  return async (req, res, next) => {
    if (!req || !res || typeof res.status !== "function") {
      return next();
    }

    try {
      const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
      if (!token) {
        return sendUnauthorizedError(res, "Authorization token required");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return sendUnauthorizedError(res, error.name === "TokenExpiredError" ? "Token expired" : "Invalid token");
    }
  };
};

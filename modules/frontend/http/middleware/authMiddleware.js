import jwt from "jsonwebtoken";
import { sendErrorResponse, sendUnauthorizedError } from "../../../admin/http/traits/responseHandler.js";

export const verifyTempToken = (req, res, next) => {
  const token = req.body.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return sendErrorResponse(res, "Token is required", null, 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      decoded.type !== "TEMP_TOKEN" ||
      (decoded.purpose !== "register" && decoded.purpose !== "forgot_password")
    ) {
      return sendErrorResponse(res, "Invalid token purpose", null, 401);
    }

    // ✅ Attach decoded data to request
    req.auth = decoded;
    req.token = token;

    next();
  } catch (err) {
    return sendErrorResponse(res, "Invalid or expired token", null, 401);
  }
};



export const verifyToken = () => {
  return async (req, res, next) => {
    // Skip processing during module loading (no valid req/res)
    if (!req || !res || typeof res.status !== "function") {
      return next();
    }

    try {
      // Get token from Authorization header or cookie
      const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
      if (!token) {
        return sendUnauthorizedError(res, "Authorization token required");
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

     req.auth = decoded;
      next();
    } catch (error) {
      console.error("Auth middleware error:", {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      return sendUnauthorizedError(res, error.name === "TokenExpiredError" ? "Token expired" : "Invalid token");
    }
  };
};




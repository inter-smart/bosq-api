import jwt from "jsonwebtoken";
import { sendErrorResponse } from "../../../admin/http/traits/responseHandler.js";

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

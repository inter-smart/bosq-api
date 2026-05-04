const { sendErrorResponse } = require("../../../admin/http/traits/responseHandler");

const verifyUserSession = (req, res, next) => {
  const access_token = req?.cookies?.access_token;
  const refresh_token = req?.cookies?.refresh_token;
  const guest_token = req?.cookies?.guest_cart_session;

  const hasAccessToken = !!access_token;
  const hasRefreshToken = !!refresh_token;
  const hasGuestToken = !!guest_token;

  const isLoggedIn = hasAccessToken || hasRefreshToken;
  const isGuestUser = hasGuestToken && !isLoggedIn;
  const isNoSession = !hasAccessToken && !hasRefreshToken && !hasGuestToken;

  console.log({
    hasAccessToken,
    hasRefreshToken,
    hasGuestToken,
    isLoggedIn,
    isGuestUser,
    isNoSession,
  });

  // 🚨 Case 1: stale guest (your original intent)
  if (!isLoggedIn && hasGuestToken) {
    return sendErrorResponse(res, new Error("User session has expired. Please log in again."), null, 401);
  }

  // 🚨 Case 2: completely no session (optional handling)
  if (isNoSession) {
    return sendErrorResponse(res, new Error("No session found. Please log in."), null, 401);
  }

  next();
};

module.exports = { verifyUserSession };

const ms = require("ms");

// JWT token lifetimes — used in jwt.sign({ expiresIn })
const JWT = {
  ACCESS_EXPIRY: process.env.JWT_EXPIRES_IN || "15m",
  ACCESS_EXPIRY_EXTENDED: process.env.JWT_EXPIRES_IN_EXTENDED || "1d",
  REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  REFRESH_EXPIRY_EXTENDED: process.env.JWT_REFRESH_EXPIRES_IN_EXTENDED || "30d",
  ADMIN_EXPIRY: process.env.JWT_ADMIN_EXPIRES_IN || "30m",
  REGISTER_TEMP_EXPIRY: "5m",
  FORGOT_PASSWORD_TEMP_EXPIRY: "15m",
};

// Cookie maxAge (milliseconds) — derived from JWT lifetimes so they stay in sync
const COOKIE = {
  ACCESS_MAX_AGE: ms(JWT.ACCESS_EXPIRY),
  ACCESS_MAX_AGE_EXTENDED: ms(JWT.ACCESS_EXPIRY_EXTENDED),
  REFRESH_MAX_AGE: ms(JWT.REFRESH_EXPIRY),
  REFRESH_MAX_AGE_EXTENDED: ms(JWT.REFRESH_EXPIRY_EXTENDED),
  GUEST_SESSION_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Redis TTLs (seconds) and OTP durations (milliseconds)
const TTL = {
  OTP_MS: 5 * 60 * 1000,                          // OTP validity — used for DB expires_at
  OTP_SECONDS: 5 * 60,                             // OTP validity — used for response expiresIn & Redis
  REGISTER_TEMP_TOKEN_SECONDS: 5 * 60,
  FORGOT_PASSWORD_TEMP_TOKEN_SECONDS: 5 * 60,
  ADMIN_PASSWORD_RESET_OTP_SECONDS: 60 * 60,       // 1 hour
  ADMIN_VERIFIED_MARKER_SECONDS: 5 * 60,           // 5 minutes
  ADMIN_RESEND_OTP_SECONDS: 10 * 60,               // 10 minutes
  ADMIN_RATE_LIMIT_SECONDS: 60 * 60,               // 1 hour
};

module.exports = { JWT, COOKIE, TTL };

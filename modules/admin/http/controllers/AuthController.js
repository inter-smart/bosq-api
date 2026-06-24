const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../database/models/index");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendUnauthorizedError, sendCustomError } = require("../traits/responseHandler");
const {
  validationLogin,
  validateResendOtp,
  validateCurrentUserPassword,
  validateResetPassword,
  validateVerifyOtp,
  validatePasswordResetRequest,
} = require("../request/auth/AuthRequest");
const EmailService = require("../../../../services/EmailService");
const ms = require("ms");
const { JWT, TTL } = require("../../../../config/authConfig.js");
const { SUPER_ADMIN_SLUG } = require("../../../../database/seeders/rbac/roles");

const AdminUser = models.AdminUser;

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Loads an admin's roles + the union of their permissions' module keys.
const getAccessInfo = async (adminUserId) => {
  const admin = await AdminUser.findOne({
    where: { id: adminUserId, status: true },
    include: [
      {
        model: models.Role,
        as: "roles",
        include: [{ model: models.Permission, as: "permissions" }],
      },
    ],
  });

  const roles = admin?.roles || [];
  const isSuperAdmin = roles.some((role) => role.slug === SUPER_ADMIN_SLUG);
  const permissions = [...new Set(roles.flatMap((role) => role.permissions.map((p) => p.module)))];

  return {
    isSuperAdmin,
    permissions,
    roles: roles.map((role) => ({ id: role.id, name: role.name, slug: role.slug })),
  };
};

class AuthController {
  static async login(req, res) {
    await Promise.all(validationLogin.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { email, password } = req.body;
      const user = await AdminUser.findOne({
        where: { email, status: true },
        attributes: ["id", "username", "email", "password", "createdAt", "updatedAt"],
      });

      if (!user) return sendUnauthorizedError(res, "Invalid email or password");

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return sendUnauthorizedError(res, "Invalid email or password");

      const tokenPayload = { id: user.id, email: user.email };
      const expiresIn = JWT.ADMIN_EXPIRY;
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn,
        issuer: process.env.JWT_ISSUER || "bosq",
      });

      const expiresAt = new Date(Date.now() + ms(expiresIn));
      const access = await getAccessInfo(user.id);

      console.log(`[Admin AuthController] Login successful for user: ${user.email}. Token expires in: ${expiresIn}`);
      sendSuccessResponse(
        res,
        {
          token,
          user,
          ...access,
          tokenType: "Bearer",
          expiresIn,
          expiresAt: expiresAt.toISOString(),
          expiresAtUnix: Math.floor(expiresAt.getTime() / 1000),
        },
        "Login successful",
      );
    } catch (error) {
      console.error("Login error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async me(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return sendUnauthorizedError(res, "User not authenticated");

      const user = await AdminUser.findOne({
        where: { id: userId, status: true },
        attributes: ["id", "username", "email", "createdAt", "updatedAt"],
      });

      if (!user) return sendUnauthorizedError(res, "User not found or inactive");

      const access = await getAccessInfo(userId);
      return sendSuccessResponse(res, { user, ...access }, "OK");
    } catch (error) {
      console.error("Me error:", error);
      return sendErrorResponse(res, error);
    }
  }

  static async requestPasswordReset(req, res) {
    await Promise.all(validatePasswordResetRequest.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { email } = req.body;
      const redisClient = req.app.get("redisClient");

      if (!redisClient) {
        console.error("Redis client not available");
        return sendErrorResponse(res, new Error("Service temporarily unavailable"));
      }

      // Check rate limiting (3 requests per hour per email)
      const rateLimitKey = `forgot-password-rate:${email.toLowerCase()}`;
      const attempts = await redisClient.get(rateLimitKey);

      if (attempts && parseInt(attempts) >= 3) {
        return sendCustomError(res, "Too many password reset requests. Please try again in 1 hour", 429);
      }

      // Increment rate limit counter
      const newAttempts = await redisClient.incr(rateLimitKey);
      if (newAttempts === 1) {
        await redisClient.expire(rateLimitKey, TTL.ADMIN_RATE_LIMIT_SECONDS);
      }

      // Check if user exists
      const user = await AdminUser.findOne({
        where: { email: email.toLowerCase(), status: true },
        attributes: ["id", "email", "username"],
      });

      // Always return success message (prevent email enumeration)
      if (!user) {
        console.log(`Password reset requested for non-existent/inactive email: ${email}`);
        return sendSuccessResponse(res, null, "If your email is registered, you will receive a password reset code", 200);
      }

      // Generate 6-digit OTP
      const otp = generateOTP();

      const otpData = {
        otp: otp,
        email: user.email,
        createdAt: new Date().toISOString(),
        attempts: 0,
      };

      await redisClient.setEx(
        `password-reset-otp:${user.email.toLowerCase()}`,
        TTL.ADMIN_PASSWORD_RESET_OTP_SECONDS,
        JSON.stringify(otpData),
      );

      // Send password reset email
      try {
        await EmailService.sendPasswordResetEmail(user.email, {
          first_name: user.username || "User",
          otp: otp,
          expiry_minutes: "60",
          year: new Date().getFullYear(),
        });

        console.info(`Password reset OTP sent to: ${user.email}`);
      } catch (emailError) {
        console.error(`Failed to send password reset email to ${user.email}:`, emailError);
        // Don't fail the request if email fails
      }

      return sendSuccessResponse(res, null, "If your email is registered, you will receive a password reset code", 200);
    } catch (error) {
      console.error("Request password reset error:", error);
      return sendErrorResponse(res, error);
    }
  }

  static async resetPassword(req, res) {
    await Promise.all(validateResetPassword.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { email, newPassword } = req.body;
      const redisClient = req.app.get("redisClient");

      const verifiedKey = `password-reset-verified:${email.toLowerCase()}`;
      const otpKey = `password-reset-otp:${email.toLowerCase()}`;

      const isVerified = await redisClient.get(verifiedKey);
      if (!isVerified) {
        return sendCustomError(res, "OTP verification required before resetting password", 403);
      }

      const user = await AdminUser.findOne({
        where: { email: email.toLowerCase(), status: true },
        attributes: ["id", "email", "password"],
      });

      if (!user) {
        return sendCustomError(res, "User not found or inactive", 404);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await sequelize.transaction(async (t) => {
        await user.update({ password: hashedPassword }, { transaction: t });
      });

      // Cleanup
      await redisClient.del(verifiedKey);
      await redisClient.del(otpKey);

      return sendSuccessResponse(res, null, "Password has been reset successfully", 200);
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  static async verifyResetOtp(req, res) {
    await Promise.all(validateVerifyOtp.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { email, otp } = req.body;
      const redisClient = req.app.get("redisClient");

      const otpKey = `password-reset-otp:${email.toLowerCase()}`;
      const verifiedKey = `password-reset-verified:${email.toLowerCase()}`;

      const otpDataStr = await redisClient.get(otpKey);
      if (!otpDataStr) {
        return sendCustomError(res, "Invalid or expired OTP", 400);
      }

      const otpData = JSON.parse(otpDataStr);

      // Max 5 attempts
      if (otpData.attempts >= 5) {
        await redisClient.del(otpKey);
        return sendCustomError(res, "Too many failed attempts. Request a new OTP", 429);
      }

      // OTP mismatch
      if (otpData.otp !== otp) {
        otpData.attempts += 1;
        const ttl = await redisClient.ttl(otpKey);
        await redisClient.setEx(otpKey, ttl, JSON.stringify(otpData));

        return sendCustomError(res, `Invalid OTP. ${5 - otpData.attempts} attempts remaining`, 400);
      }

      await redisClient.setEx(verifiedKey, TTL.ADMIN_VERIFIED_MARKER_SECONDS, "true");

      return sendSuccessResponse(res, null, "OTP verified successfully. You may now reset your password", 200);
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  static async resendOtp(req, res) {
    await Promise.all(validateResendOtp.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { email } = req.body;
      const redisClient = req.app.get("redisClient");

      if (!redisClient) {
        console.error("Redis client not available");
        return sendErrorResponse(res, new Error("Service temporarily unavailable"));
      }

      // Check rate limiting (3 requests per hour per email for resends too)
      const rateLimitKey = `forgot-password-rate:${email.toLowerCase()}`;
      const attempts = await redisClient.get(rateLimitKey);

      if (attempts && parseInt(attempts) >= 3) {
        return sendCustomError(res, "Too many password reset requests. Please try again in 1 hour", 429);
      }

      // Increment rate limit counter
      const newAttempts = await redisClient.incr(rateLimitKey);
      if (newAttempts === 1) {
        await redisClient.expire(rateLimitKey, TTL.ADMIN_RATE_LIMIT_SECONDS);
      }

      // Check if user exists
      const user = await AdminUser.findOne({
        where: { email: email.toLowerCase(), status: true },
        attributes: ["id", "email", "username"],
      });

      // Always return success message (prevent email enumeration)
      if (!user) {
        console.log(`OTP resend requested for non-existent/inactive email: ${email}`);
        return sendSuccessResponse(res, null, "If your email is registered, you will receive a new password reset code", 200);
      }

      // Generate new 6-digit OTP
      const otp = generateOTP();

      // Store new OTP in Redis (overwrites old one)
      const otpData = {
        otp: otp,
        email: user.email,
        createdAt: new Date().toISOString(),
        attempts: 0,
      };

      await redisClient.setEx(
        `password-reset-otp:${user.email.toLowerCase()}`,
        TTL.ADMIN_RESEND_OTP_SECONDS,
        JSON.stringify(otpData),
      );

      // Send password reset email
      try {
        await EmailService.sendPasswordResetEmail(user.email, {
          first_name: user.username || "User",
          otp: otp,
          expiry_minutes: "10",
          year: new Date().getFullYear(),
        });

        console.info(`Password reset OTP resent to: ${user.email}`);
      } catch (emailError) {
        console.error(`Failed to resend password reset email to ${user.email}:`, emailError);
        // Don't fail the request if email fails
      }

      return sendSuccessResponse(res, null, "If your email is registered, you will receive a new password reset code", 200);
    } catch (error) {
      console.error("Resend OTP error:", error);
      return sendErrorResponse(res, error);
    }
  }

  static async changeCurrentUserPassword(req, res) {
    await Promise.all(validateCurrentUserPassword.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      // Get user ID from token (set by authMiddleware)
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return sendUnauthorizedError(res, "User not authenticated");
      }

      // Check if user exists
      const user = await AdminUser.findOne({
        where: { id: userId, status: true },
        attributes: ["id", "username", "email", "password"],
      });

      if (!user) {
        return sendCustomError(res, "User not found or inactive", 404);
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return sendCustomError(res, "Current password is incorrect", 400);
      }

      // Hash new password (salt rounds = 12, same as registration)
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password with transaction
      await sequelize.transaction(async (t) => {
        await user.update({ password: hashedPassword }, { transaction: t });
      });

      console.info(`Password changed successfully for user: ${user.email}`);

      return sendSuccessResponse(res, null, "Password has been changed successfully", 200);
    } catch (error) {
      console.error("Change password error:", error);
      return sendErrorResponse(res, error);
    }
  }
}

module.exports = AuthController;

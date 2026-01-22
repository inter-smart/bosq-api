const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../database/models/index");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendUnauthorizedError,
  sendCustomError,
} = require("../traits/responseHandler");
const {
  validationRequestPost,
  validationLogin,
  validatePasswordReset,
  validateResendOtp,
  validateCurrentUserPassword,
  validateResetPassword,
  validateVerifyOtp,
  validatePasswordResetRequest,
} = require("../request/auth/AuthRequest");
const EmailService = require("../../../../services/EmailService");
const ms = require("ms");

const AdminUser = models.AdminUser;

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

class AuthController {
  static async register(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { username, password, email, role } = req.body;

      // Check existing user
      const existingUserByUsername = await AdminUser.findOne({
        where: { username },
      });
      if (existingUserByUsername) {
        return sendErrorResponse(res, new Error("Username already exists"), {
          statusCode: 409,
        });
      }

      const existingUserByEmail = await AdminUser.findOne({ where: { email } });
      if (existingUserByEmail) {
        return sendErrorResponse(res, new Error("Email already exists"), {
          statusCode: 409,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await sequelize.transaction(async (t) =>
        AdminUser.create(
          { username, email, password: hashedPassword, role: role || "user" },
          { transaction: t },
        ),
      );

      return sendSuccessResponse(
        res,
        { user },
        "User registered successfully",
        201,
      );
    } catch (error) {
      console.error("Register error:", error);
      return sendErrorResponse(res, error);
    }
  }

  static async login(req, res) {
    await Promise.all(validationLogin.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { email, password } = req.body;
      const user = await AdminUser.findOne({
        where: { email, status: true },
        attributes: [
          "id",
          "username",
          "email",
          "role",
          "password",
          "createdAt",
          "updatedAt",
        ],
      });

      if (!user) return sendUnauthorizedError(res, "Invalid email or password");

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid)
        return sendUnauthorizedError(res, "Invalid email or password");

      const tokenPayload = { id: user.id, email: user.email, role: user.role };
      const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn,
        issuer: process.env.JWT_ISSUER || "your-app-name",
      });

      const expiresAt = new Date(Date.now() + ms(expiresIn));

      sendSuccessResponse(
        res,
        {
          token,
          user,
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

  static async requestPasswordReset(req, res) {
    await Promise.all(validatePasswordResetRequest.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { email } = req.body;
      const redisClient = req.app.get("redisClient");

      if (!redisClient) {
        console.error("Redis client not available");
        return sendErrorResponse(
          res,
          new Error("Service temporarily unavailable"),
        );
      }

      // Check rate limiting (3 requests per hour per email)
      const rateLimitKey = `forgot-password-rate:${email.toLowerCase()}`;
      const attempts = await redisClient.get(rateLimitKey);

      if (attempts && parseInt(attempts) >= 3) {
        return sendCustomError(
          res,
          "Too many password reset requests. Please try again in 1 hour",
          429,
        );
      }

      // Increment rate limit counter
      const newAttempts = await redisClient.incr(rateLimitKey);
      if (newAttempts === 1) {
        await redisClient.expire(rateLimitKey, 3600); // 1 hour
      }

      // Check if user exists
      const user = await AdminUser.findOne({
        where: { email: email.toLowerCase(), status: true },
        attributes: ["id", "email", "username"],
      });

      // Always return success message (prevent email enumeration)
      if (!user) {
        console.log(
          `Password reset requested for non-existent/inactive email: ${email}`,
        );
        return sendSuccessResponse(
          res,
          null,
          "If your email is registered, you will receive a password reset code",
          200,
        );
      }

      // Generate 6-digit OTP
      const otp = generateOTP();

      // Store OTP in Redis with 10-minute expiration
      const otpData = {
        otp: otp,
        email: user.email,
        createdAt: new Date().toISOString(),
        attempts: 0,
      };

      await redisClient.setEx(
        `password-reset-otp:${user.email.toLowerCase()}`,
        600, // 10 minutes
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

        console.info(`Password reset OTP sent to: ${user.email}`);
      } catch (emailError) {
        console.error(
          `Failed to send password reset email to ${user.email}:`,
          emailError,
        );
        // Don't fail the request if email fails
      }

      return sendSuccessResponse(
        res,
        null,
        "If your email is registered, you will receive a password reset code",
        200,
      );
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
        return sendCustomError(
          res,
          "OTP verification required before resetting password",
          403,
        );
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

      return sendSuccessResponse(
        res,
        null,
        "Password has been reset successfully",
        200,
      );
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
        return sendCustomError(
          res,
          "Too many failed attempts. Request a new OTP",
          429,
        );
      }

      // OTP mismatch
      if (otpData.otp !== otp) {
        otpData.attempts += 1;
        const ttl = await redisClient.ttl(otpKey);
        await redisClient.setEx(otpKey, ttl, JSON.stringify(otpData));

        return sendCustomError(
          res,
          `Invalid OTP. ${5 - otpData.attempts} attempts remaining`,
          400,
        );
      }

      // OTP verified → mark verified for 5 minutes
      await redisClient.setEx(verifiedKey, 300, "true");

      return sendSuccessResponse(
        res,
        null,
        "OTP verified successfully. You may now reset your password",
        200,
      );
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
        return sendErrorResponse(
          res,
          new Error("Service temporarily unavailable"),
        );
      }

      // Check rate limiting (3 requests per hour per email for resends too)
      const rateLimitKey = `forgot-password-rate:${email.toLowerCase()}`;
      const attempts = await redisClient.get(rateLimitKey);

      if (attempts && parseInt(attempts) >= 3) {
        return sendCustomError(
          res,
          "Too many password reset requests. Please try again in 1 hour",
          429,
        );
      }

      // Increment rate limit counter
      const newAttempts = await redisClient.incr(rateLimitKey);
      if (newAttempts === 1) {
        await redisClient.expire(rateLimitKey, 3600); // 1 hour
      }

      // Check if user exists
      const user = await AdminUser.findOne({
        where: { email: email.toLowerCase(), status: true },
        attributes: ["id", "email", "username"],
      });

      // Always return success message (prevent email enumeration)
      if (!user) {
        console.log(
          `OTP resend requested for non-existent/inactive email: ${email}`,
        );
        return sendSuccessResponse(
          res,
          null,
          "If your email is registered, you will receive a new password reset code",
          200,
        );
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
        600, // 10 minutes
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
        console.error(
          `Failed to resend password reset email to ${user.email}:`,
          emailError,
        );
        // Don't fail the request if email fails
      }

      return sendSuccessResponse(
        res,
        null,
        "If your email is registered, you will receive a new password reset code",
        200,
      );
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
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
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

      return sendSuccessResponse(
        res,
        null,
        "Password has been changed successfully",
        200,
      );
    } catch (error) {
      console.error("Change password error:", error);
      return sendErrorResponse(res, error);
    }
  }
}

module.exports = AuthController;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const { sendValidationError, sendErrorResponse, sendSuccessResponse, sendCustomError } = require("../../../../admin/http/traits/responseHandler.js");
const {
  validateRegisterRequest,
  verifyOtpValidation,
  createPasswordRequest,
  loginRequest,
  forgotPasswordRequest,
} = require("../../request/authRequest.js");
const { models, sequelize } = require("../../../../../database/models/index.js");
const EmailService = require("../../../../../services/EmailService.js");
const { generateSlugWithTimestamp } = require("../../traits/mediaButtonHelper.js");
const { Op } = require("sequelize");

const Users = models.Users;
const Otps = models.Otps;

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

class UsersService {
  static async register(req, res) {
    const transaction = await sequelize.transaction();
    try {
      // Run express-validator rules
      await Promise.all(validateRegisterRequest.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      let { name, countryCode, mobile, email } = req.body;

      // Trim & normalize inputs
      name = name?.trim();
      countryCode = countryCode?.trim();
      mobile = mobile?.trim();
      email = email?.trim().toLowerCase();

      // Required field check (handles empty strings & spaces)k
      if (!name || !countryCode || !mobile || !email) {
        return sendErrorResponse(res, "All fields are required", null, 400);
      }

      // Check if user already exists
      const existingUser = await Users.findOne({
        where: { email },
        transaction,
      });

      const baseSlug = generateSlugWithTimestamp(name);

      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // If user exists
      if (existingUser) {
        // If already verified → block
        if (existingUser.email_verified) {
          return sendErrorResponse(res, "User already exists", null, 400);
        }

        await Otps.create(
          {
            email,
            user_id: existingUser.id,
            otp_code: otp,
            purpose: "register",
            expires_at: expiresAt,
          },
          { transaction },
        );

        await transaction.commit();

        // Send OTP email after transaction commit
        try {
          await EmailService.sendOtp(email, otp);
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
          return sendErrorResponse(res, "Failed to send OTP email. Please try again.", null, 500);
        }

        return res.status(200).json({
          success: true,
          message: "OTP resent successfully",
          data: { email, expiresIn: 300 },
        });
      }

      // Create user first to get the user ID
      const newUser = await Users.create(
        {
          name,
          country_code: countryCode,
          mobile,
          email,
          email_verified: false,
          slug: baseSlug,
        },
        { transaction },
      );

      // Create OTP with user_id as foreign key
      await Otps.create(
        {
          email,
          user_id: newUser.id,
          otp_code: otp,
          purpose: "register",
          expires_at: expiresAt,
        },
        { transaction },
      );

      await transaction.commit();
      EmailService.sendOtp(email, otp);

      return res.status(201).json({
        success: true,
        message: "OTP sent successfully",
        data: { email, expiresIn: 300 },
      });
    } catch (error) {
      await transaction.rollback();

      // Handle race condition (duplicate email)
      if (error.name === "SequelizeUniqueConstraintError") {
        return sendErrorResponse(res, "User already exists", null, 400);
      }

      console.error("Register Error:", error);
      return sendErrorResponse(res, error.message, null, 500);
    }
  }

  static async verifyOtp(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(verifyOtpValidation.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      let { email, otp } = req.body;
      const redisClient = req.app.get("redisClient");

      email = email?.trim().toLowerCase();
      otp = otp?.trim();

      // Find OTP (not used yet)
      const otpRecord = await Otps.findOne({
        where: {
          email,
          otp_code: otp,
          purpose: "register",
          is_used: false,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!otpRecord) {
        await transaction.rollback();
        return sendCustomError(res, "Invalid OTP", 400);
      }

      // Check expiration
      if (new Date() > new Date(otpRecord.expires_at)) {
        await transaction.rollback();
        return sendCustomError(res, "OTP has expired", 400);
      }

      // Mark OTP as used (no delete)
      await otpRecord.update({ is_used: true }, { transaction });

      await Users.update({ email_verified: true }, { where: { email }, transaction });
      // Generate temp jwt token

      const tempToken = jwt.sign(
        {
          email,
          purpose: "register",
          type: "TEMP_TOKEN",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "5m",
          issuer: process.env.JWT_ISSUER || "BOSQ",
        },
      );
      if (!redisClient) {
        throw new Error("Redis client not available");
      }

      // Store temp token (5 min TTL)
      await redisClient.setEx(`register-temp-token:${email}`, 300, JSON.stringify({ tempToken, email }));

      await transaction.commit();

      return sendSuccessResponse(res, { tempToken }, "OTP verified successfully", 200);
    } catch (error) {
      await transaction.rollback();
      console.error("Verify OTP Error:", error);
      return sendErrorResponse(res, error.message, null, 500);
    }
  }

  // Password creation
  static async createPassword(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(createPasswordRequest.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { password } = req.body;
      const { email } = req.auth;
      const token = req.token;
      const redisClient = req.app.get("redisClient");

      if (!redisClient) {
        throw new Error("Redis client not available");
      }

      if (!password || !password.trim()) {
        return sendErrorResponse(res, "Password IS required", null, 400);
      }

      const redisKey = `register-temp-token:${email}`;
      const redisData = await redisClient.get(redisKey);

      if (!redisData) {
        await transaction.rollback();
        return sendErrorResponse(res, "Token expired or already used", null, 401);
      }

      const { tempToken } = JSON.parse(redisData);

      if (tempToken !== token) {
        return sendErrorResponse(res, "Token mismatch", null, 401);
      }

      // Find user
      const user = await Users.findOne({
        where: { email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        await transaction.rollback();
        return sendErrorResponse(res, "User not found", null, 404);
      }

      /* 🔴 Password already set (important!) */
      if (user.password) {
        await transaction.rollback();
        return sendErrorResponse(res, "Password already created", null, 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password
      await user.update({ password: hashedPassword }, { transaction });

      // Remove temp token from Redis
      await redisClient.del(`register-temp-token:${email}`);

      await transaction.commit();

      return sendSuccessResponse(res, { userId: user.id }, "Account created successfully", 200);
    } catch (error) {
      console.error("Password creation failed:", error);
      return sendErrorResponse(res, error.message, null, 500);
    }
  }

  static async login(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(loginRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendValidationError(res, errors.array());
      }

      const { email, password } = req.body;
      const user = await Users.findOne({
        where: { email },
        attributes: ["id", "email", "password", "name", "country_code", "mobile"],
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        return sendErrorResponse(res, "User not found", null, 404);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        await transaction.rollback();
        return sendErrorResponse(res, "Invalid password", null, 401);
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        issuer: process.env.JWT_ISSUER || "BOSQ",
      });

      res.cookie("access_token", token, {
        httpOnly: true,
        // sameSite: "none" MUST have secure: true to be accepted by browsers
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });

      const mobileNumber = `${user.country_code} ${user.mobile}`;

      await transaction.commit();

      return {
        success: true,
        message: "Login successful",
        data: { user: { id: user.id, name: user.name, phone: mobileNumber, email: user.email } },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Login Error:", error);

      if (!res.headersSent) {
        return sendErrorResponse(res, error.message, null, 500);
      }
    }
  }

  // forgot password
  static async forgotPassword(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(forgotPasswordRequest.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { email } = req.body;

      const user = await Users.findOne({
        where: { email },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        return sendErrorResponse(res, "User not found", null, 404);
      }

      const lastOtp = await Otps.findOne({
        where: {
          email,
          purpose: "forgot_password",
          is_used: false,
          created_at: {
            [Op.gt]: sequelize.literal("NOW() - INTERVAL '1 minute'"),
          },
        },
        transaction,
      });

      if (lastOtp) {
        await transaction.rollback();
        return sendErrorResponse(res, "Please wait before requesting another OTP", null, 429);
      }

      // invalidate old OTPs
      await Otps.update(
        { is_used: true },
        {
          where: {
            email,
            purpose: "forgot_password",
            is_used: false,
          },
          transaction,
        },
      );

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await Otps.create(
        {
          user_id: user.id,
          email,
          otp_code: otp,
          purpose: "forgot_password",
          is_used: false,
          expires_at: expiresAt,
        },
        { transaction },
      );
      await transaction.commit();

      // respond first
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: { expiresIn: 300 },
      });

      // async email
      EmailService.sendOtp(email, otp).catch((err) => console.error("OTP email failed:", err));
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Login Error:", error);
      return sendErrorResponse(res, error.message, null, 500);
    }
  }

  static async verifyForgotPasswordOtp(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(verifyOtpValidation.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      let { email, otp } = req.body;
      const redisClient = req.app.get("redisClient");

      email = email?.trim().toLowerCase();
      otp = otp?.trim();

      // Find OTP (not used yet)
      const otpRecord = await Otps.findOne({
        where: {
          email,
          otp_code: otp,
          purpose: "forgot_password",
          is_used: false,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!otpRecord) {
        await transaction.rollback();
        return sendCustomError(res, "Invalid OTP", 400);
      }

      // Check expiration
      if (new Date() > new Date(otpRecord.expires_at)) {
        await transaction.rollback();
        return sendCustomError(res, "OTP has expired", 400);
      }

      // Mark OTP as used (no delete)
      await otpRecord.update({ is_used: true }, { transaction });

      await Users.update({ email_verified: true }, { where: { email }, transaction });
      // Generate temp jwt token

      const resetToken = jwt.sign(
        {
          email,
          purpose: "forgot_password",
          type: "TEMP_TOKEN",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "5m",
          issuer: process.env.JWT_ISSUER || "BOSQ",
        },
      );

      if (!redisClient) {
        throw new Error("Redis client not available");
      }

      // Store temp token (5 min TTL)
      await redisClient.setEx(`forgot-password-temp-token:${email}`, 300, JSON.stringify({ resetToken, email }));

      await transaction.commit();

      return sendSuccessResponse(res, { resetToken }, "OTP verified successfully", 200);
    } catch (error) {
      await transaction.rollback();
      console.error("Verify OTP Error:", error);
      return sendErrorResponse(res, error.message, null, 500);
    }
  }

  // Password creation
  static async createNewPassword(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(createPasswordRequest.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { password } = req.body;
      const { email } = req.auth;
      const token = req.token;
      const redisClient = req.app.get("redisClient");

      if (!redisClient) {
        throw new Error("Redis client not available");
      }

      if (!password || !password.trim()) {
        return sendErrorResponse(res, "Password Is required", null, 400);
      }

      const redisKey = `forgot-password-temp-token:${email}`;
      const redisData = await redisClient.get(redisKey);

      if (!redisData) {
        await transaction.rollback();
        return sendErrorResponse(res, "Token expired or already used", null, 401);
      }

      const { resetToken } = JSON.parse(redisData);

      if (resetToken !== token) {
        return sendErrorResponse(res, "Token mismatch", null, 401);
      }

      // Find user
      const user = await Users.findOne({
        where: { email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        await transaction.rollback();
        return sendErrorResponse(res, "User not found", null, 404);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password
      await user.update({ password: hashedPassword }, { transaction });

      // Remove temp token from Redis
      await redisClient.del(`forgot-password-temp-token:${email}`);

      await transaction.commit();

      return sendSuccessResponse(res, { userId: user.id }, "Password reset successfully", 200);
    } catch (error) {
      console.error("Password creation failed:", error);
      return sendErrorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = UsersService;

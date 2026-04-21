const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ErrorHandler } = require("../../traits/errorHandler.js");
const { RESPONSE_MESSAGES, HTTP_STATUS, ERROR_CODES } = require("../../traits/constants.js");
const { models, sequelize } = require("../../../../../database/models/index.js");
const EmailService = require("../../../../../services/EmailService.js");
const { generateSlugWithTimestamp } = require("../../traits/mediaButtonHelper.js");
const { Op } = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";
const COOKIEAGE = 1 * 60 * 1000; // 1 minute for testing

const Users = models.Users;
const Otps = models.Otps;
const AuthSessions = models.AuthSessions;

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

class UsersService {
  static async register(req) {
    const transaction = await sequelize.transaction();
    try {
      let { name, countryCode, mobile, email } = req.body;

      // Trim & normalize inputs
      name = name?.trim();
      countryCode = countryCode?.trim();
      mobile = mobile?.trim();
      email = email?.trim().toLowerCase();

      // Required field check (handles empty strings & spaces)
      if (!name || !countryCode || !mobile || !email) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.ALL_FIELDS_REQUIRED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
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
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.USER_ALREADY_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ERROR);
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
          throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OTP_EMAIL_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR);
        }

        return {
          data: { email, expiresIn: 300 },
          message: RESPONSE_MESSAGES.SUCCESS.OTP_RESENT,
          status: HTTP_STATUS.OK,
        };
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

      return {
        data: { email, expiresIn: 300 },
        message: RESPONSE_MESSAGES.SUCCESS.REGISTER_SUCCESS,
        status: HTTP_STATUS.CREATED,
      };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      // Handle race condition (duplicate email)
      if (error.name === "SequelizeUniqueConstraintError") {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.USER_ALREADY_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ERROR);
      }

      console.error("Register Error:", error);
      throw error;
    }
  }

  static async verifyOtp(req) {
    const transaction = await sequelize.transaction();

    try {
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
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.INVALID_OTP, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      // Check expiration
      if (new Date() > new Date(otpRecord.expires_at)) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
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

      return { data: { tempToken } };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Verify OTP Error:", error);
      throw error;
    }
  }

  static async createPassword(req) {
    const transaction = await sequelize.transaction();

    try {
      const { password } = req.body;
      const { email } = req.auth;
      const token = req.token;
      const redisClient = req.app.get("redisClient");

      if (!redisClient) {
        throw new Error("Redis client not available");
      }

      if (!password || !password.trim()) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const redisKey = `register-temp-token:${email}`;
      const redisData = await redisClient.get(redisKey);

      if (!redisData) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      const { tempToken } = JSON.parse(redisData);

      if (tempToken !== token) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      // Find user
      const user = await Users.findOne({
        where: { email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      // Password already set
      if (user.password) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PASSWORD_ALREADY_SET, HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ERROR);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password
      await user.update({ password: hashedPassword }, { transaction });

      // Remove temp token from Redis
      await redisClient.del(`register-temp-token:${email}`);

      await transaction.commit();

      return { data: { userId: user.id } };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Password creation failed:", error);
      throw error;
    }
  }

  static async login(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { email, password, rememberMe } = req.body;
      const accessExpiry = rememberMe ? process.env.JWT_EXPIRES_IN_EXTENDED || "1d" : process.env.JWT_EXPIRES_IN || "15m";
      const refreshExpiry = rememberMe ? process.env.JWT_REFRESH_EXPIRES_IN_EXTENDED || "30d" : process.env.JWT_REFRESH_EXPIRES_IN || "7d";
      const accessMaxAge = rememberMe ? 24 * 60 * 60 * 1000 : COOKIEAGE;
      const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

      const user = await Users.findOne({
        where: { email },
        attributes: ["id", "email", "password", "auth_provider", "name", "country_code", "mobile", "status"],
      });

      if (!user) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      if (user.status !== "active") {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.ACCOUNT_DEACTIVATED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_ERROR);
      }

      if (user.auth_provider === "google" && !user.password) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.GOOGLE_LOGIN_REQUIRED, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      if (!user.password) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PASSWORD_INCORRECT, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.PASSWORD_INCORRECT, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      const token = jwt.sign({ id: user.id, email: user.email, status: user.status }, process.env.JWT_SECRET, {
        expiresIn: accessExpiry,
        issuer: process.env.JWT_ISSUER || "BOSQ",
      });

      const refreshToken = jwt.sign({ id: user.id, email: user.email, status: user.status }, process.env.JWT_SECRET, {
        expiresIn: refreshExpiry,
        issuer: process.env.JWT_ISSUER || "BOSQ",
      });

      const refreshExpiresAt = new Date(Date.now() + refreshMaxAge);

      await AuthSessions.create(
        {
          user_id: user.id,
          access_token: token,
          refresh_token: refreshToken,
          user_agent: req.headers["user-agent"] || null,
          ip_address: req.ip || null,
          expires_at: refreshExpiresAt,
        },
        { transaction },
      );

      res.cookie("access_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: accessMaxAge,
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: refreshMaxAge,
      });

      const mobileNumber = `${user.country_code} ${user.mobile}`;

      await transaction.commit();

      console.log(`[AuthService] Login successful for user: ${user.email}. Access token expiry: ${accessExpiry}, Refresh token expiry: ${refreshExpiry}`);
      return {
        data: { user: { id: user.id, name: user.name, phone: mobileNumber, email: user.email } },
      };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Login Error:", error);
      throw error;
    }
  }

  static async forgotPassword(req) {
    const transaction = await sequelize.transaction();

    try {
      const { email } = req.body;

      const user = await Users.findOne({
        where: { email },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
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
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OTP_RATE_LIMITED, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_ERROR);
      }

      // Invalidate old OTPs
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

      // Async email
      EmailService.sendOtp(email, otp).catch((err) => console.error("OTP email failed:", err));

      return { data: { expiresIn: 300 } };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Forgot Password Error:", error);
      throw error;
    }
  }

  static async verifyForgotPasswordOtp(req) {
    const transaction = await sequelize.transaction();

    try {
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
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.INVALID_OTP, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      // Check expiration
      if (new Date() > new Date(otpRecord.expires_at)) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
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
          expiresIn: "15m",
          issuer: process.env.JWT_ISSUER || "BOSQ",
        },
      );

      if (!redisClient) {
        throw new Error("Redis client not available");
      }

      // Store temp token (5 min TTL)
      await redisClient.setEx(`forgot-password-temp-token:${email}`, 300, JSON.stringify({ resetToken, email }));

      await transaction.commit();

      return { data: { resetToken } };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Verify Forgot Password OTP Error:", error);
      throw error;
    }
  }

  static async createNewPassword(req) {
    const transaction = await sequelize.transaction();

    try {
      const { password } = req.body;
      const { email } = req.auth;
      const token = req.token;
      const redisClient = req.app.get("redisClient");

      if (!redisClient) {
        throw new Error("Redis client not available");
      }

      if (!password || !password.trim()) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const redisKey = `forgot-password-temp-token:${email}`;
      const redisData = await redisClient.get(redisKey);

      if (!redisData) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      const { resetToken } = JSON.parse(redisData);

      if (resetToken !== token) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      // Find user
      const user = await Users.findOne({
        where: { email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND_ERROR);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password
      await user.update({ password: hashedPassword }, { transaction });

      // Remove temp token from Redis
      await redisClient.del(`forgot-password-temp-token:${email}`);

      await transaction.commit();

      return { data: { userId: user.id } };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Create New Password Error:", error);
      throw error;
    }
  }

  static async googleLogin(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { token } = req.body;

      console.log(process.env.JWT_EXPIRES_IN);

      if (!token) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.GOOGLE_TOKEN_REQUIRED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      // Verify the access token and get user info from Google
      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!googleRes.ok) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.GOOGLE_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      const googleUser = await googleRes.json();
      const { email, name, picture } = googleUser;

      if (!email) {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.GOOGLE_EMAIL_MISSING, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find or create user by email
      let user = await Users.findOne({
        where: { email: normalizedEmail },
        transaction,
      });

      if (!user) {
        const baseSlug = generateSlugWithTimestamp(name || normalizedEmail.split("@")[0]);
        user = await Users.create(
          {
            name: name || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            email_verified: true,
            slug: baseSlug,
            profile_image: picture || null,
            auth_provider: "google",
          },
          { transaction },
        );
      } else if (!user.email_verified) {
        await user.update({ email_verified: true }, { transaction });
      }

      if (user.status !== "active") {
        await transaction.rollback();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.ACCOUNT_DEACTIVATED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_ERROR);
      }

      // Sign JWT (same pattern as regular login)
      const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        issuer: process.env.JWT_ISSUER || "BOSQ",
      });

      const googleRefreshToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        issuer: process.env.JWT_ISSUER || "BOSQ",
      });

      const googleRefreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await AuthSessions.create(
        {
          user_id: user.id,
          access_token: jwtToken,
          refresh_token: googleRefreshToken,
          user_agent: req.headers["user-agent"] || null,
          ip_address: req.ip || null,
          expires_at: googleRefreshExpiresAt,
        },
        { transaction },
      );

      res.cookie("access_token", jwtToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: COOKIEAGE,
      });

      res.cookie("refresh_token", googleRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      await transaction.commit();

      return {
        data: { user: { id: user.id, name: user.name, email: user.email } },
      };
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Google Login Error:", error);
      throw error;
    }
  }
  static async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (err) {
        // Token is expired or invalid — revoke any matching session
        await AuthSessions.destroy({ where: { refresh_token: refreshToken } });
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      const session = await AuthSessions.findOne({ where: { refresh_token: refreshToken } });

      if (!session) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      if (new Date() > new Date(session.expires_at)) {
        await session.destroy();
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_ERROR);
      }

      const newAccessToken = jwt.sign({ id: decoded.id, email: decoded.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        issuer: process.env.JWT_ISSUER || "BOSQ",
      });

      await session.update({ access_token: newAccessToken });

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: COOKIEAGE,
      });

      console.log(`[AuthService] Refresh token successful for user: ${decoded.email}. New access token issued.`);
      return { data: {} };
    } catch (error) {
      console.error("Refresh Token Error:", error);
      throw error;
    }
  }
}

module.exports = UsersService;

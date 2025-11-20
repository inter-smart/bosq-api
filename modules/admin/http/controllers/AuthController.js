const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../database/models/index");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendUnauthorizedError } = require("../traits/responseHandler");
const { validationRequestPost, validationLogin } = require("../request/auth/AuthRequest");
const ms = require("ms");

const AdminUser = models.AdminUser;

class AuthController {
  static async register(req, res) {
    await Promise.all(validationRequestPost.map(v => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { username, password, email, role } = req.body;

      // Check existing user
      const existingUserByUsername = await AdminUser.findOne({ where: { username } });
      if (existingUserByUsername) {
        return sendErrorResponse(res, new Error("Username already exists"), { statusCode: 409 });
      }

      const existingUserByEmail = await AdminUser.findOne({ where: { email } });
      if (existingUserByEmail) {
        return sendErrorResponse(res, new Error("Email already exists"), { statusCode: 409 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await sequelize.transaction(async (t) =>
        AdminUser.create(
          { username, email, password: hashedPassword, role: role || "user" },
          { transaction: t }
        )
      );

      return sendSuccessResponse(res, { user }, "User registered successfully", 201);
    } catch (error) {
      console.error("Register error:", error);
      return sendErrorResponse(res, error);
    }
  }

  static async login(req, res) {
    await Promise.all(validationLogin.map(v => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors);

    try {
      const { username, password } = req.body;
      const user = await AdminUser.findOne({
        where: { username, status: true },
        attributes: ["id", "username", "email", "role", "password", "createdAt", "updatedAt"],
      });

      if (!user) return sendUnauthorizedError(res, "Invalid username or password");

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return sendUnauthorizedError(res, "Invalid username or password");

      const tokenPayload = { id: user.id, username: user.username, role: user.role };
      const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || "fallback-secret-key", {
        expiresIn,
        issuer: process.env.JWT_ISSUER || "your-app-name",
      });

      const expiresAt = new Date(Date.now() + ms(expiresIn));

      sendSuccessResponse(res, {
        token,
        user,
        tokenType: "Bearer",
        expiresIn,
        expiresAt: expiresAt.toISOString(),
        expiresAtUnix: Math.floor(expiresAt.getTime() / 1000),
      }, "Login successful");
    } catch (error) {
      console.error("Login error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = AuthController;

const crypto = require("crypto");
const { validationResult } = require("express-validator");
const {
  sendValidationError,
  sendErrorResponse,
  sendSuccessResponse,
  sendCustomError,
} = require("../../../../admin/http/traits/responseHandler.js");
const { validationRequestPost, verifyOtpValidation } = require("../../request/authRequest.js");
const { models, sequelize } = require("../../../../../database/models/index.js");

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

class UsersService {
  static async register(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(validateRegisterRequest.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors);

      const { name, countryCode, mobile, email } = req.body;

      if (!name || !countryCode || !mobile || !email) {
        return sendErrorResponse(res, "All fields are required", null, 400);
      }

      const existingUser = await models.Users.findOne({
        where: {
          email: email,
        },
        transaction,
      });

      if (existingUser) {
        return sendErrorResponse(res, "User already exist", null, 400);
      }

      const otp = generateOtp();

      await models.Otps.create(
        {
          email,
          otp_code: otp,
          purpose: "register",
          expires_at: new Date(Date.now() + 5 * 60 * 1000),
        },
        { transaction },
      );

      await transaction.commit();

      return {
        success: true,
        message: "OTP sent successfully",
        data: { email, expiresIn: 300 },
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error data: ${error.message}`);
    }
  }

  static async verifyOtp(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(verifyOtpValidation.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) return sendValidationError(res, errors);

      const { email, otp } = req.body;
      const redisClient = req.app.get("redisClient");

      // Find valid OTP record
      const otpRecord = await models.Otps.findOne({
        where: {
          email: email.toLowerCase(),
          otp_code: otp,
          purpose: "register",
          is_used: false,
        },
        transaction,
      });

      if (!otpRecord) {
        await transaction.rollback();
        return sendCustomError(res, "Invalid or expired OTP", 400);
      }

      // Check if OTP is expired
      if (new Date() > new Date(otpRecord.expires_at)) {
        await transaction.rollback();
        return sendCustomError(res, "OTP has expired", 400);
      }

      // Mark OTP as used
      await otpRecord.update({ is_used: true }, { transaction });

      // Generate and store temp token in Redis (5 min TTL)
      const tempToken = crypto.randomBytes(32).toString("hex");
      await redisClient.setEx(
        `register-temp-token:${email.toLowerCase()}`,
        300,
        JSON.stringify({ tempToken, email: email.toLowerCase() })
      );

      await transaction.commit();

      return sendSuccessResponse(
        res,
        { tempToken },
        "OTP verified successfully",
        200
      );
    } catch (error) {
      await transaction.rollback();
      return sendErrorResponse(res, error);
    }
  }

  static async login() {
    return {
      data: {},
      message: "Login successfully",
    };
  }
}

module.exports = UsersService;

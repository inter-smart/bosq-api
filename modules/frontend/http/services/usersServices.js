const { models, sequelize } = require("../../../../database/models/index.js");
const bcrypt = require("bcrypt");
const { changePasswordRequestPost, personalInfoRequestPost } = require("../request/profileRequest.js");
const { validationResult } = require("express-validator");
const { sendValidationError } = require("../../../admin/http/traits/responseHandler.js");
const { buildProfieSection, buildProfileEditSection } = require("../traits/dataManipulations/profileSections.js");
const { validateRecaptcha } = require("../../../../services/RecaptchaValidation");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, RESPONSE_MESSAGES, ERROR_CODES } = require("../traits/constants.js");

class UsersServices {
  static async getProfileData(req, res) {
    try {
      const { id } = req.auth;
      const data = await models.Users.findOne({
        where: { id },
        attributes: ["name", "first_name", "last_name", "profile_image", "country_code", "mobile", "email"],
        include: [
          {
            model: models.Address,
            as: "addresses",
            where: {
              is_default: true,
              status: "active",
            },
            required: false,
            attributes: [
              "id",
              "address_type",
              "name",
              "company_name",
              "email",
              "country_code",
              "phone",
              "street_address",
              "apartment",
              "order_notes",
            ],
            include: [
              {
                model: models.State,
                as: "state",
                attributes: ["name", "slug"],
                include: [
                  {
                    model: models.Country,
                    as: "country",
                    attributes: ["name", "slug"],
                  },
                ],
              },
              {
                model: models.Address,
                as: "shipping_address",
                // attributes: ["id", "name", "country_code", "phone"],
                include: [
                  {
                    model: models.State,
                    as: "state",
                    attributes: ["name", "slug"],
                    include: [
                      {
                        model: models.Country,
                        as: "country",
                        attributes: ["name", "slug"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const profileData = buildProfieSection(data);

      return profileData;
    } catch (error) {
      console.error("Error getting profile data:", error);
      throw ErrorHandler.createError(
        RESPONSE_MESSAGES.ERROR.DATA_FETCH_FAILED,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.DATA_FETCH_ERROR,
      );
    }
  }

  // Fetch profile by id
  static async fetchProfileById(req, res) {
    const { id } = req.auth;

    try {
      // Fetch the user profile data
      const user = await models.Users.findOne({
        where: { id },
        attributes: ["name", "first_name", "last_name", "country_code", "mobile", "email"],
      });

      if (!user) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.NOT_FOUND_ERROR,
        );
      }

      const profileData = buildProfileEditSection(user);

      return profileData;
    } catch (error) {
      if (error.isOperational) throw error;
      console.error("Error fetching profile data:", error);
      throw ErrorHandler.createError(
        RESPONSE_MESSAGES.ERROR.DATA_FETCH_FAILED,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.DATA_FETCH_ERROR,
      );
    }
  }

  static async editProfile(req, res) {
    const transaction = await sequelize.transaction();
    try {
      await Promise.all(personalInfoRequestPost.map((validation) => validation.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendValidationError(res, errors.array());
      }

      const { id } = req.auth;
      const { display_name, first_name, last_name, country_code, mobile, email, recaptcha_token } = req.body || {};

      const token = recaptcha_token;

      if (!token) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.RECAPTCHA_MISSING,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const { success, score, action } = await validateRecaptcha(token);

      console.log("reCAPTCHA result:", { success, score, action });

      if (!success || score < 0.5) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.RECAPTCHA_FAILED,
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const user = await models.Users.findOne({
        where: { id },
        transaction,
      });

      // Check if email is being changed and if it's already used by another user
      if (email && email !== user.email) {
        const isEmailTaken = await models.Users.findOne({
          where: { email },
          transaction,
        });

        if (isEmailTaken) {
          throw ErrorHandler.createError(
            RESPONSE_MESSAGES.ERROR.EMAIL_ALREADY_IN_USE,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.DUPLICATE_ERROR,
          );
        }
      }

      const updatedData = {};
      if (display_name !== undefined) updatedData.name = display_name;
      if (first_name !== undefined) updatedData.first_name = first_name;
      if (last_name !== undefined) updatedData.last_name = last_name;
      if (country_code !== undefined) updatedData.country_code = country_code;
      if (mobile !== undefined) updatedData.mobile = mobile;
      if (email !== undefined) updatedData.email = email;

      await user.update(updatedData, { transaction });

      await transaction.commit();

      const responseUser = await models.Users.findOne({
        where: { id },
        attributes: ["name", "first_name", "last_name", "country_code", "mobile", "email"],
      });

      return responseUser;
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating profile data:", error);
      if (error.isOperational) throw error;
      throw ErrorHandler.createError(
        RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  static async changePassword(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(changePasswordRequestPost.map((validation) => validation.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendValidationError(res, errors.array());
      }

      const { id: userId } = req.auth;
      const { currentPassword, newPassword, recaptcha_token } = req.body;

      const token = recaptcha_token;
      const isDev = process.env.NODE_ENV !== "production";

      if (!isDev) {
        if (!token) {
          throw ErrorHandler.createError(
            RESPONSE_MESSAGES.ERROR.RECAPTCHA_MISSING,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
          );
        }

        const { success, score, action } = await validateRecaptcha(token);

        console.log("reCAPTCHA result:", { success, score, action });

        if (!success || score < 0.5) {
          throw ErrorHandler.createError(
            RESPONSE_MESSAGES.ERROR.RECAPTCHA_FAILED,
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.VALIDATION_ERROR,
          );
        }
      }

      // 1. Fetch user with row lock
      const user = await models.Users.findOne({
        where: { id: userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.USER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.NOT_FOUND_ERROR,
        );
      }

      // 2. Handle users without password (social login)
      if (!user.password) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.USER_NO_PASSWORD,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.AUTH_ERROR,
        );
      }

      // 3. Verify old password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.CURRENT_PASSWORD_INCORRECT,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.AUTH_ERROR,
        );
      }

      // 4. Prevent reusing same password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.PASSWORD_SAME_AS_OLD,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      // 5. Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // 6. Update password
      await user.update(
        {
          password: hashedPassword,
          password_changed_at: new Date(),
        },
        { transaction },
      );

      // 7. Invalidate all active sessions
      await models.AuthSessions.destroy({
        where: { user_id: userId },
        transaction,
      });

      // 8. Commit transaction
      await transaction.commit();

      return null;
    } catch (error) {
      await transaction.rollback();
      console.error("Change password error:", error);
      if (error.isOperational) throw error;
      throw ErrorHandler.createError(
        RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  static async logout(req, res) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (refreshToken) {
        await models.AuthSessions.destroy({ where: { refresh_token: refreshToken } });
      }

      const isProduction = process.env.NODE_ENV === "production";
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      };

      res.clearCookie("access_token", cookieOptions);
      res.clearCookie("refresh_token", cookieOptions);

      return null;
    } catch (error) {
      console.error("Logout Error:", error);
      throw ErrorHandler.createError(
        RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }
}

module.exports = UsersServices;

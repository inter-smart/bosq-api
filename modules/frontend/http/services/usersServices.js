const { models, sequelize } = require("../../../../database/models/index.js");
const bcrypt = require("bcrypt");
const { changePasswordRequestPost, personalInfoRequestPost } = require("../request/profileRequest.js");
const { validationResult } = require("express-validator");
const { sendValidationError, sendErrorResponse, sendSuccessResponse } = require("../../../admin/http/traits/responseHandler.js");
const { buildProfieSection, buildProfileEditSection } = require("../traits/dataManipulations/profileSections.js");
const { validateRecaptcha } = require("../../../../services/RecaptchaValidation");

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
      throw new Error(`Error fetching profile data: ${error.message}`);
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
        return res.status(404).json({
          message: "User not found",
        });
      }

      const profileData = buildProfileEditSection(user);

      return profileData;
    } catch (error) {
      console.error("Error fetching profile data:", error);
      throw new Error(`Error fetching profile data: ${error.message}`);
    }
  }

  static async editProfile(req, res) {
    const transaction = await sequelize.transaction();
    try {
      await Promise.all(personalInfoRequestPost.map((validation) => validation.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { id } = req.auth;
      const { display_name, first_name, last_name, country_code, mobile, email, recaptcha_token } = req.body || {};

      // ✅ Correct token key
      const token = recaptcha_token;

      if (!token) {
        throw new Error("reCAPTCHA token missing");
      }

      const { success, score, action } = await validateRecaptcha(token);

      console.log("reCAPTCHA result:", { success, score, action });

      // ✅ v3 validation
      if (!success || score < 0.5) {
        const error = new Error("reCAPTCHA verification failed. Please try again.");
        error.statusCode = 403;
        throw error;
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
          await transaction.rollback();
          return sendErrorResponse(res, "Email already in use by another account", null, 400);
        }
      }

      const updatedData = {};
      if (display_name !== undefined) updatedData.name = display_name;
      if (first_name !== undefined) updatedData.first_name = first_name;
      if (last_name !== undefined) updatedData.last_name = last_name;
      if (country_code !== undefined) updatedData.country_code = country_code;
      if (mobile !== undefined) updatedData.mobile = mobile;
      if (email !== undefined) updatedData.email = email; // Added email update

      await user.update(updatedData, { transaction });

      await transaction.commit();

      const responseUser = await models.Users.findOne({
        where: { id },
        attributes: ["name", "first_name", "last_name", "country_code", "mobile", "email"],
      });

      return sendSuccessResponse(res, responseUser, "Profile updated successfully", 200);
    } catch (error) {
      await transaction.rollback(); // Added rollback on error
      console.error("Error updating profile data:", error);
      return res.status(500).json({
        success: false,
        message: `Error updating profile data: ${error.message}`,
      });
    }
  }

  static async changePassword(req, res) {
    const transaction = await sequelize.transaction();

    try {
      await Promise.all(changePasswordRequestPost.map((validation) => validation.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { id: userId } = req.auth;
      const { currentPassword, newPassword, recaptcha_token } = req.body;

      // ✅ Correct token key
      const token = recaptcha_token;

      if (!token) {
        throw new Error("reCAPTCHA token missing");
      }

      const { success, score, action } = await validateRecaptcha(token);

      console.log("reCAPTCHA result:", { success, score, action });

      // ✅ v3 validation
      if (!success || score < 0.5) {
        const error = new Error("reCAPTCHA verification failed. Please try again.");
        error.statusCode = 403;
        throw error;
      }

      // 1. Fetch user with row lock
      const user = await models.Users.findOne({
        where: { id: userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 2. Handle users without password (social login)
      if (!user.password) {
        await transaction.rollback();
        return sendErrorResponse(res, "User does not have a password", null, 401);
      }

      // 3. Verify old password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        await transaction.rollback();
        return sendErrorResponse(res, "Current password is incorrect", null, 401);
      }

      // 4. Prevent reusing same password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "New password must be different from old password",
        });
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

      return sendSuccessResponse(res, null, "Password changed successfully. Please login later.", 200);
    } catch (error) {
      await transaction.rollback();
      console.error("Change password error:", error);
      throw new Error(`Error fetching profile data: ${error.message}`);
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return sendSuccessResponse(res, null, "Logout successful", 200);
    } catch (error) {
      console.error("Logout Error:", error);
      return sendErrorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = UsersServices;

const { models, sequelize } = require("../../../../database/models/index.js");
const bcrypt = require("bcrypt");
const { changePasswordRequestPost } = require("../request/profileRequest.js");
const { validationResult } = require("express-validator");
const {
  sendValidationError,
} = require("../../../admin/http/traits/responseHandler.js");

class UsersServices {
  static async getProfileData(req, res) {

    console.log("req cookies", req.cookie)
    try {
      const { email } = req.auth;
      const data = await models.Users.findOne({
        where: { email },
        attributes: [
          "name",
          "profile_image",
          "country_code",
          "mobile",
          "address",
          "email",
        ],
      });

      return data;
    } catch (error) {
      console.error("Error getting profile data:", error);
      throw new Error(`Error fetching profile data: ${error.message}`);
    }
  }

  static async editProfile(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.auth;
      const { name, first_name, last_name, country_code, mobile, email } =
        req.body || {};

      const user = await models.Users.findOne({
        where: { id },
        transaction,
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const updatedData = {};
      if (name !== undefined) updatedData.name = name;
      if (first_name !== undefined) updatedData.first_name = first_name;
      if (last_name !== undefined) updatedData.last_name = last_name;
      if (country_code !== undefined) updatedData.country_code = country_code;
      if (mobile !== undefined) updatedData.mobile = mobile;
      if (email !== undefined) updatedData.email = email; // Added email update

      await user.update(updatedData, { transaction });

      await transaction.commit();

      const responseUser = await models.Users.findOne({
        where: { id },
        attributes: [
          "name",
          "first_name",
          "last_name",
          "country_code",
          "mobile",
          "email",
        ],
      });

      return res.status(200).json({
        success: true,
        data: responseUser,
      });
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
      await Promise.all(
        changePasswordRequestPost.map((validation) => validation.run(req)),
      );
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(res, errors.array());
      }

      const { id: userId } = req.auth;
      const { password, new_password } = req.body;


      console.log("passwords:", password, new_password)
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
        return res.status(400).json({
          success: false,
          message: "Password not set. Please use reset password",
        });
      }

      // 3. Verify old password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // 4. Prevent reusing same password
      const isSamePassword = await bcrypt.compare(new_password, user.password);
      if (isSamePassword) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "New password must be different from old password",
        });
      }

      // 5. Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 12);

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

      return res.status(200).json({
        success: true,
        message: "Password changed successfully. Please login again.",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Change password error:", error);
      throw new Error(`Error fetching profile data: ${error.message}`);
    }
  }
}

module.exports = UsersServices;

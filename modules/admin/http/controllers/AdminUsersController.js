const bcrypt = require("bcrypt");
const { models } = require("../../../../database/models/index.js");
const { sendSuccessResponse, sendErrorResponse, sendNotFoundError, sendCustomError } = require("../traits/responseHandler.js");
const { paginate } = require("../traits/datatablePaginationHelper.js");
const requirePermission = require("../middleware/requirePermission.js");

const AdminUser = models.AdminUser;
const Role = models.Role;

const withRoles = { include: [{ model: Role, as: "roles" }] };

class AdminUsersController {
  static async index(req, res) {
    try {
      const result = await paginate(AdminUser, req, {
        order: [["createdAt", "DESC"]],
        searchFields: ["username", "email"],
        attributes: ["id", "username", "email", "status", "createdAt", "updatedAt"],
        ...withRoles,
      });

      sendSuccessResponse(res, { list: result.data, pagination: result.pagination }, "Admin users retrieved successfully");
    } catch (error) {
      console.error("Admin users index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    try {
      const admin = await AdminUser.findByPk(req.params.id, {
        attributes: ["id", "username", "email", "status", "createdAt", "updatedAt"],
        ...withRoles,
      });
      if (!admin) return sendNotFoundError(res, "Admin user");
      sendSuccessResponse(res, { user: admin }, "Admin user retrieved successfully");
    } catch (error) {
      console.error("Admin user show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    try {
      const { username, email, password, role_ids = [] } = req.body;
      if (!username || !email || !password) {
        return sendCustomError(res, "username, email and password are required", 422);
      }

      const existing = await AdminUser.findOne({ where: { email } });
      if (existing) {
        return sendCustomError(res, "Email already exists", 409);
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const admin = await AdminUser.create({ username, email, password: hashedPassword });

      if (role_ids.length) {
        const roles = await Role.findAll({ where: { id: role_ids } });
        await admin.setRoles(roles);
      }

      const created = await AdminUser.findByPk(admin.id, {
        attributes: ["id", "username", "email", "status", "createdAt", "updatedAt"],
        ...withRoles,
      });
      sendSuccessResponse(res, { user: created }, "Admin user created successfully", 201);
    } catch (error) {
      console.error("Admin user store error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    try {
      const admin = await AdminUser.findByPk(req.params.id);
      if (!admin) return sendNotFoundError(res, "Admin user");

      const { username, email, status, role_ids } = req.body;
      const updates = {};
      if (username !== undefined) updates.username = username;
      if (email !== undefined) updates.email = email;
      if (status !== undefined) updates.status = status;
      if (Object.keys(updates).length) await admin.update(updates);

      if (Array.isArray(role_ids)) {
        const roles = await Role.findAll({ where: { id: role_ids } });
        await admin.setRoles(roles);
      }

      requirePermission.clearCache(admin.id);

      const updated = await AdminUser.findByPk(admin.id, {
        attributes: ["id", "username", "email", "status", "createdAt", "updatedAt"],
        ...withRoles,
      });
      sendSuccessResponse(res, { user: updated }, "Admin user updated successfully");
    } catch (error) {
      console.error("Admin user update error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async resetPassword(req, res) {
    try {
      const admin = await AdminUser.findByPk(req.params.id);
      if (!admin) return sendNotFoundError(res, "Admin user");

      const { password } = req.body;
      if (!password) return sendCustomError(res, "password is required", 422);

      const hashedPassword = await bcrypt.hash(password, 12);
      await admin.update({ password: hashedPassword });

      sendSuccessResponse(res, null, "Password reset successfully");
    } catch (error) {
      console.error("Admin user reset password error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroy(req, res) {
    try {
      const admin = await AdminUser.findByPk(req.params.id);
      if (!admin) return sendNotFoundError(res, "Admin user");

      if (admin.id === req.user?.id) {
        return sendCustomError(res, "You cannot delete your own account", 403);
      }

      await admin.destroy();
      requirePermission.clearCache(admin.id);
      sendSuccessResponse(res, null, "Admin user deleted successfully");
    } catch (error) {
      console.error("Admin user destroy error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = AdminUsersController;

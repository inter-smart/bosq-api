const { models } = require("../../../../database/models/index.js");
const { sendSuccessResponse, sendErrorResponse, sendNotFoundError, sendCustomError } = require("../traits/responseHandler.js");
const { SUPER_ADMIN_SLUG, SEO_TEAM_SLUG } = require("../../../../database/seeders/rbac/roles.js");
const requirePermission = require("../middleware/requirePermission.js");

const Role = models.Role;
const Permission = models.Permission;

const PROTECTED_ROLE_SLUGS = [SUPER_ADMIN_SLUG];

class RolesController {
  static async permissionsCatalog(req, res) {
    try {
      const permissions = await Permission.findAll({ order: [["module", "ASC"]] });
      sendSuccessResponse(res, { permissions }, "Permissions catalog retrieved successfully");
    } catch (error) {
      console.error("Permissions catalog error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async index(req, res) {
    try {
      const roles = await Role.findAll({
        include: [{ model: Permission, as: "permissions" }],
        order: [["createdAt", "ASC"]],
      });
      sendSuccessResponse(res, { roles }, "Roles retrieved successfully");
    } catch (error) {
      console.error("Roles index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    try {
      const role = await Role.findByPk(req.params.id, {
        include: [{ model: Permission, as: "permissions" }],
      });
      if (!role) return sendNotFoundError(res, "Role");
      sendSuccessResponse(res, { role }, "Role retrieved successfully");
    } catch (error) {
      console.error("Role show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    try {
      const { name, slug, module_keys = [] } = req.body;
      if (!name || !slug) {
        return sendCustomError(res, "name and slug are required", 422);
      }

      const role = await Role.create({ name, slug });
      const permissions = await Permission.findAll({ where: { slug: module_keys } });
      await role.setPermissions(permissions);

      const created = await Role.findByPk(role.id, { include: [{ model: Permission, as: "permissions" }] });
      sendSuccessResponse(res, { role: created }, "Role created successfully", 201);
    } catch (error) {
      console.error("Role store error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    try {
      const role = await Role.findByPk(req.params.id);
      if (!role) return sendNotFoundError(res, "Role");

      if (PROTECTED_ROLE_SLUGS.includes(role.slug)) {
        return sendCustomError(res, "Super Admin role cannot be modified", 403);
      }

      const { name, module_keys } = req.body;
      if (name) await role.update({ name });

      if (Array.isArray(module_keys)) {
        const permissions = await Permission.findAll({ where: { slug: module_keys } });
        await role.setPermissions(permissions);

        const AdminUserRole = models.AdminUserRole;
        const affected = await AdminUserRole.findAll({ where: { role_id: role.id } });
        affected.forEach((link) => requirePermission.clearCache(link.admin_user_id));
      }

      const updated = await Role.findByPk(role.id, { include: [{ model: Permission, as: "permissions" }] });
      sendSuccessResponse(res, { role: updated }, "Role updated successfully");
    } catch (error) {
      console.error("Role update error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroy(req, res) {
    try {
      const role = await Role.findByPk(req.params.id);
      if (!role) return sendNotFoundError(res, "Role");

      if (PROTECTED_ROLE_SLUGS.includes(role.slug)) {
        return sendCustomError(res, "This role cannot be deleted", 403);
      }

      await role.destroy();
      sendSuccessResponse(res, null, "Role deleted successfully");
    } catch (error) {
      console.error("Role destroy error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = RolesController;

const jwt = require("jsonwebtoken");
const { sendUnauthorizedError, sendForbiddenError } = require("../traits/responseHandler");
const { models } = require("../../../../database/models");
const { SUPER_ADMIN_SLUG } = require("../../../../database/seeders/rbac/roles");

const AdminUser = models.AdminUser;

const CACHE_TTL_MS = 60 * 1000;
const permissionCache = new Map(); // admin_user_id -> { isSuperAdmin, modules: Set, expiresAt }

const loadAdminAccess = async (adminUserId) => {
  const cached = permissionCache.get(adminUserId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const admin = await AdminUser.findOne({
    where: { id: adminUserId, status: true },
    include: [
      {
        model: models.Role,
        as: "roles",
        include: [{ model: models.Permission, as: "permissions" }],
      },
    ],
  });

  const roles = admin?.roles || [];
  const isSuperAdmin = roles.some((role) => role.slug === SUPER_ADMIN_SLUG);
  const modules = new Set(roles.flatMap((role) => role.permissions.map((permission) => permission.module)));

  const access = { isSuperAdmin, modules, expiresAt: Date.now() + CACHE_TTL_MS };
  permissionCache.set(adminUserId, access);
  return access;
};

// requirePermission(module) -- replaces the old authMiddleware(['admin']) role check.
// Super admin always passes; other roles are allowed only if one of their
// assigned permissions has a matching `module`.
// Calling requirePermission() with no module (e.g. for Roles/Admin Users management)
// means "super admin only", since no role's permission set can match `undefined`.
module.exports = (module) => {
  return async (req, res, next) => {
    if (!req || !res || typeof res.status !== "function") {
      return next();
    }

    try {
      const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
      if (!token) {
        return sendUnauthorizedError(res, "Authorization token required");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      const access = await loadAdminAccess(decoded.id);
      if (!access.isSuperAdmin && !access.modules.has(module)) {
        console.warn(`[requirePermission] ${decoded.email} denied access to module "${module}" on ${req.originalUrl}`);
        return sendForbiddenError(res, "Insufficient permissions");
      }

      next();
    } catch (error) {
      console.error(`[requirePermission] Auth error on ${req.originalUrl}:`, {
        name: error.name,
        message: error.message,
      });
      return sendUnauthorizedError(res, error.name === "TokenExpiredError" ? "Token expired" : "Invalid token");
    }
  };
};

module.exports.clearCache = (adminUserId) => {
  if (adminUserId) {
    permissionCache.delete(adminUserId);
  } else {
    permissionCache.clear();
  }
};

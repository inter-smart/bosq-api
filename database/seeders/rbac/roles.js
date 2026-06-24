const { models } = require("../../models");

const Role = models.Role;

const SUPER_ADMIN_SLUG = "super_admin";

const seedRoles = async () => {
  const [superAdminRole] = await Role.findOrCreate({
    where: { slug: SUPER_ADMIN_SLUG },
    defaults: { name: "Super Admin", slug: SUPER_ADMIN_SLUG },
  });

  return { superAdminRole };
};

module.exports = { seedRoles, SUPER_ADMIN_SLUG };

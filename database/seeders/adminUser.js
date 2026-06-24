const bcrypt = require("bcrypt");
const { models } = require("../models");
const { seedPermissions } = require("./rbac/permissions");
const { seedRoles } = require("./rbac/roles");

const AdminUser = models.AdminUser;

const createAdminUser = async () => {
  try {
    await seedPermissions();
    const { superAdminRole } = await seedRoles();

    let admin = await AdminUser.findOne({
      where: { username: "afsal@intersmart.in" },
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      admin = await AdminUser.create({
        username: "afsal@intersmart.in",
        email: "afsal@intersmart.in",
        password: hashedPassword,
      });
    }

    const existingRoles = await admin.getRoles({ where: { id: superAdminRole.id } });
    if (!existingRoles.length) {
      await admin.addRole(superAdminRole);
    }
  } catch (error) {
    console.error("❌ Failed to create admin user:", error.message);
  }
};

module.exports = { createAdminUser };

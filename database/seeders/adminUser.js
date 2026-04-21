const bcrypt = require("bcrypt");
const AdminUser = require("../models").models.AdminUser;

const createAdminUser = async () => {
  try {
    const existingAdmin = await AdminUser.findOne({
      where: { username: "afsal@intersmart.in" },
    });

    if (existingAdmin) {
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await AdminUser.create({
      username: "afsal@intersmart.in",
      email: "afsal@intersmart.in",
      password: hashedPassword,
      role: "admin",
    });
  } catch (error) {
    console.error("❌ Failed to create admin user:", error.message);
  }
};

module.exports = { createAdminUser };

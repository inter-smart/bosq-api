const bcrypt = require("bcrypt");
const AdminUser = require("../models").models.AdminUser;


const createAdminUser = async () => {
  try {
    const existingAdmin = await AdminUser.findOne({
      where: { username: "govindnikhil508@gmail.com" },
    });

    if (existingAdmin) {
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await AdminUser.create({
      username: "govindnikhil508@gmail.com",
      email: "govindnikhil508@gmail.com",
      password: hashedPassword,
      role: "admin",
    });
  } catch (error) {
    console.error("❌ Failed to create admin user:", error.message);
  }
};

module.exports = { createAdminUser };

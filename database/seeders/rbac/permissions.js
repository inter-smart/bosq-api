const { models } = require("../../models");

const Permission = models.Permission;

// One permission per top-level sidebar module.
const PERMISSION_CATALOG = [
  { slug: "dashboard", name: "Dashboard", module: "dashboard" },
  { slug: "orders", name: "Orders", module: "orders" },
  { slug: "enquiries", name: "Enquiries", module: "enquiries" },
  { slug: "cms", name: "CMS", module: "cms" },
  { slug: "products", name: "Products", module: "products" },
  { slug: "projects", name: "Projects", module: "projects" },
  { slug: "blog", name: "Blog", module: "blog" },
  { slug: "news", name: "News", module: "news" },
  { slug: "landing_pages", name: "Landing Pages", module: "landing_pages" },
  { slug: "settings", name: "Settings & Content", module: "settings" },
  { slug: "coupons", name: "Coupons", module: "coupons" },
  { slug: "policies", name: "Policies", module: "policies" },
  { slug: "users", name: "Users", module: "users" },
];

const seedPermissions = async () => {
  for (const permission of PERMISSION_CATALOG) {
    await Permission.findOrCreate({
      where: { slug: permission.slug },
      defaults: permission,
    });
  }
};

module.exports = { seedPermissions, PERMISSION_CATALOG };

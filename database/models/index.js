const sequelize = require("../config/index");

const defineAdminUser = require("./adminuser");

// HOME
const defineHomeCms = require("./home/homeCms");
const defineHomeBanner = require("./home/homeBanner");


// CONTACT
const defineContactCms = require("./contact/contactCms");

// FAQ
const defineFaqCms = require("./faq/faqCms");
const models = {
  AdminUser: defineAdminUser(sequelize),

  // HOME
  HomeCms: defineHomeCms(sequelize),
  HomeBanner: defineHomeBanner(sequelize),

  // CONTACT
  ContactCms: defineContactCms(sequelize),

  // FAQ
  FaqCms: defineFaqCms(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };
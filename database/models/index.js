const sequelize = require("../config/index");

const defineAdminUser = require("./adminuser");

// HOME
const defineHomeCms = require("./home/HomeCms");
const defineHomeBanner = require("./home/HomeBanner");

const models = {
  AdminUser: defineAdminUser(sequelize),

  // HOME
  HomeCms: defineHomeCms(sequelize),
  HomeBanner: defineHomeBanner(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };
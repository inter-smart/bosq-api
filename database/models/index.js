const sequelize = require("../config/index");

const defineAdminUser = require("./adminuser");


const models = {
  AdminUser: defineAdminUser(sequelize),

};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };
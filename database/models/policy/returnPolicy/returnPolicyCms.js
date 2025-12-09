const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ReturnPolicyCms = sequelize.define(
    "ReturnPolicyCms",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "return_policy_cms",
    }
  );
  return ReturnPolicyCms;
};

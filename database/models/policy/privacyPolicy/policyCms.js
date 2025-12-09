const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PolicyCms = sequelize.define(
    "PolicyCms",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },


      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "policy_cms",
      timestamps: true,
    }
  );

  return PolicyCms;
};

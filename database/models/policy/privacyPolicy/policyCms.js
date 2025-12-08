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
        allowNull: false,
      },

      title_ar: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      desription: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      desription_ar: {
        type: DataTypes.TEXT,
        allowNull: false,
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

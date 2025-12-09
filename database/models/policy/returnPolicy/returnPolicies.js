const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ReturnPolicies = sequelize.define(
    "ReturnPolicies",
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

      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "return_policies",
      timestamps: true,
    }
  );

  return ReturnPolicies;
};

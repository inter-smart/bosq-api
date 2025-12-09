const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Policies = sequelize.define(
    "Policies",
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

      status:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: 0,
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "policies",
      timestamps: true,
    }
  );

  return Policies;
};

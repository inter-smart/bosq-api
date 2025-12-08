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

      status:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
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
      tableName: "policies",
      timestamps: true,
    }
  );

  return Policies;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const WarrantyPolicy = sequelize.define(
    "WarrantyPolicy",
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

      media_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      media_alt: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "warranty_policies",
      timestamps: true,
    }
  );

  return WarrantyPolicy;
};

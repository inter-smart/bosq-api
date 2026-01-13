const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ExtraMaterials = sequelize.define(
    "ExtraMaterials",
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

      icon_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "extra_materials",
      timestamps: true,
    }
  );

  return ExtraMaterials;
};

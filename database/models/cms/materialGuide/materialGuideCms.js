const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MaterialGuideCms = sequelize.define(
    "MaterialGuideCms",
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

      banner_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      banner_title_ar: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      banner_media_desktop_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_desktop_path_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_mobile_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_mobile_path_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      banner_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      banner_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "material_guide_cms",
    }
  );

  return MaterialGuideCms;
};

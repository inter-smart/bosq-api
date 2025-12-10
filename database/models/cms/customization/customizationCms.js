const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CustomizationCms = sequelize.define(
    "CustomizationCms",
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
      banner_media_desktop_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_mobile_path: {
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
      banner_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      banner_media_type: {
        type: DataTypes.ENUM("image", "video"),
        allowNull: true,
      },
      banner_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      banner_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      banner_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      process_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      process_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      process_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      process_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      process_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      options_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      options_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      options_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      options_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      form_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      form_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      form_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      form_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      form_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      form_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      form_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "customization_cms",
    }
  );

  return CustomizationCms;
};

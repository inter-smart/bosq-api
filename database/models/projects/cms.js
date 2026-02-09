const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProjectsCms = sequelize.define(
    "ProjectsCms",
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
      banner_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      banner_title_ar: {
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
      media_type: {
        type: DataTypes.ENUM("image", "video"),
        allowNull: true,
      },
      media_desktop_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_mobile_path: {
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
      tableName: "projects_cms",
    },
  );

  return ProjectsCms;
};

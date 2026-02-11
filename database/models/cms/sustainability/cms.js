const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SustainabilityCms = sequelize.define(
    "SustainabilityCms",
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
      banner_media_type: {
        type: DataTypes.ENUM("image", "video"),
        allowNull: true,
      },
      section1_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section1_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section1_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      section1_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      section1_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      section1_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section1_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "sustainability_cms",
    }
  );

  return SustainabilityCms;
};

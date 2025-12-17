const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ErgonomicsChairCms = sequelize.define(
    "ErgonomicsChairCms",
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
    },
    {
      tableName: "ergonomics_chair_cms",
    }
  );

  return ErgonomicsChairCms;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ErgonomicCms = sequelize.define(
    "ErgonomicCms",
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
      media_desktop_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_mobile_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_desktop_path_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_mobile_path_ar: {
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
      media_type: {
        type: DataTypes.ENUM("image", "video"),
        allowNull: true,
      },
    },
    {
      tableName: "ergonomic_cms",
    }
  );

  return ErgonomicCms;
};

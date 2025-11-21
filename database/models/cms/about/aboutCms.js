const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AboutCms = sequelize.define(
    "AboutCms",
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

      banner_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      banner_description: {
        type: DataTypes.TEXT,
        allowNull: false,
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

      journey_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      journey_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      why_choose_us_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      why_choose_us_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      testimonial_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      client_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },

      news_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "about_cms",
    }
  );

  return AboutCms;
};

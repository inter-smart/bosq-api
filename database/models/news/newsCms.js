const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const NewsCms = sequelize.define(
    "NewsCms",
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
      banner_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      banner_title_ar:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      banner_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      banner_description_ar: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      media_desktop_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_mobile_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_alt:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_alt_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      popular_news_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      popular_news_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      related_news_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      related_news_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "news_cms",
    }
  );

  return NewsCms;
};

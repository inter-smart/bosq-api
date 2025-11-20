const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const HomeCms = sequelize.define(
    "HomeCms",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      banner_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      banner_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      banner_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "home_banner",
    }
  );

  return HomeBanner;
};

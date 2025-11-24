const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BlogCms = sequelize.define(
    "BlogCms",
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
      description: {
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
      }
    },
    {
      tableName: "blog_cms",
    }
  );

  return BlogCms;
};

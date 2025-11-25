const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Blogs = sequelize.define(
    "Blogs",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      media_desktop_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      media_mobile_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      media_alt: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      thumbnail_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      published_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      viewCount: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "blogs",
    }
  );

  return Blogs;
};

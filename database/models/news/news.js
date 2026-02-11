const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const News = sequelize.define(
    "News",
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
      title_ar: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
      },
      isViewed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      thumbnail_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      thumbnail_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description_ar: {
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
      media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: false,
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

      meta_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      meta_title_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      other_meta: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      other_meta_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "news",
    },
  );

  return News;
};

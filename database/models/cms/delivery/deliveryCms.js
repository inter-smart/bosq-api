const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeliveryCms = sequelize.define(
    "DeliveryCms",
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
      banner_media_desktop_path_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_mobile_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_mobile_path_ar: {
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


      banner_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      banner_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      delivery_time_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      delivery_time_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      delivery_time_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      delivery_time_subtitle_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      delivery_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      delivery_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      delivery_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "delivery_cms",
    }
  );

  return DeliveryCms;
};

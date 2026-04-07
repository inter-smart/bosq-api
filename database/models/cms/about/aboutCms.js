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
      title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      banner_media_type: {
        type: DataTypes.ENUM("image", "video"),
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
      banner_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_description_ar: {
        type: DataTypes.TEXT,
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
      banner_media_desktop_path_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_mobile_path_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_video_thumbnail_path: {
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

      banner_button_text: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      banner_button_text_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      banner_button_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      journey_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journey_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      journey_one_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      journey_two_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      journey_three_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      journey_one_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_one_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_two_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_two_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_three_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_three_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      why_choose_us_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      why_choose_us_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      why_choose_us_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      why_choose_us_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      testimonial_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      testimonial_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      client_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      news_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      news_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "about_cms",
    }
  );

  return AboutCms;
};

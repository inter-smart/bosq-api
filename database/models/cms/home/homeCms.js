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

      // ABOUT
      about_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      about_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      about_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      about_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      about_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      about_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      about_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // FEATURED PRODUCTS
      featured_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      featured_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // JOURNEY
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


      journey_media_type: {
        type: DataTypes.ENUM("image", "video"),
        allowNull: true,
      },

      

      journey_media_desktop_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journey_media_mobile_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journey_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journey_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // link
      journey_link: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      journey_thumbnail_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journey_thumbnail_path_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // PROJECT
      project_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      project_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // FITS
      fits_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fits_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      fits_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fits_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // BRANDS
      brands_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      brands_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // FORM
      form_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      form_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      form_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      form_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      form_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      form_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      form_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "home_cms",
    }
  );

  return HomeCms;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HomeCms = sequelize.define(
    'HomeCms',
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
      journy_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journy_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      journy_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journy_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      journey_media_type: {
        type: DataTypes.ENUM('image', 'video'),
        allowNull: true,
      },

      journy_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journy_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      journy_media_alt_ar: {
        type: DataTypes.STRING,
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

      // CALCULATOR
      calculator_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      calculator_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      calculator_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      calculator_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      calculator_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      calculator_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      calculator_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // CUSTOMIZE
      customize_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customize_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      customize_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customize_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      customize_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customize_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customize_media_alt_ar: {
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
      tableName: 'home_cms',
    }
  );

  return HomeCms;
};

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
     about_media_path:{
        type: DataTypes.TEXT,
        allowNull: true,
     },
     about_media_alt:{
        type: DataTypes.STRING,
        allowNull: true,
     },
     about_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      about_description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },


      // FEATURED PRODUCTS
      featured_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },


      // JOURNY
      journy_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      journy_description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journey_media_type:{
        type: DataTypes.ENUM('image', 'video'),
        allowNull: true,
      },
      journy_media_path:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      journy_media_alt:{
        type: DataTypes.STRING,
        allowNull: true,
      },


      // PROJECT
      project_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      // CALCULATOR
      calculator_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      calculator_description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      calculator_media_path:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      calculator_media_alt:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      // CUSTOMIZE 
      customize_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      customize_description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customize_media_path:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customize_media_alt:{
        type: DataTypes.STRING,
        allowNull: true,
      },


      // FITS
      fits_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      fits_description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },


      // BRANDS
      brands_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      // FORM
      form_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      form_description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      form_media_path:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      form_media_alt:{
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
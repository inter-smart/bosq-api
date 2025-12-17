const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const HeaderFooter = sequelize.define(
    "HeaderFooter",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      header_logo_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      footer_logo_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      header_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      header_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      footer_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      footer_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      address_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },


      email:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      sales_phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      
      sale_enquiry_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      sale_enquiry_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      sale_enquiry_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      support_enquiry_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      support_enquiry_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      support_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      news_letter_main_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      news_letter_main_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      news_letter_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      news_letter_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      po_box_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "header_footer",
    }
  );

  return HeaderFooter;
};

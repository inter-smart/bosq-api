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

      footer_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      language:{
        type: DataTypes.ENUM,
        values: ['en', 'ar'],
        allowNull: false,
        defaultValue: 'en',
      },

      address:{
        type: DataTypes.TEXT,
        allowNull: true,
      },

      sale_enquiry_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      sale_enquiry_email:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      support_email:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      phone_number:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      news_letter_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      po_box_number:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      

    },
    {
      tableName: "header_footer",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return HeaderFooter;
};
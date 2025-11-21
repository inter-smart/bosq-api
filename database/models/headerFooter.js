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

      header_logo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      footer_logo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      logo_alt: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      favicon: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      footer_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },



      location_one_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location_one_email: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location_one_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location_two_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location_two_email: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location_two_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },



      apple_app_store_image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      apple_app_store_image_alt: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      apple_app_store_image_link: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      playstore_image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      playstore_image_alt: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      playstore_image_link: {
        type: DataTypes.TEXT,
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

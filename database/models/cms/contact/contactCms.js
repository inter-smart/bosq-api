const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ContactCms = sequelize.define(
    "ContactCms",
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
      media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "contact_cms",
    }
  );

  return ContactCms;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AuthCms = sequelize.define(
    "AuthCms",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      login_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      login_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      login_description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      login_description_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_description_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      login_media_desktop_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      login_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      login_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_media_desktop_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      signup_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "auth_cms",
    }
  );

  return AuthCms;
};

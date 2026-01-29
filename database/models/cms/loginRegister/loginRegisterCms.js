const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoginRegisterCms = sequelize.define(
    'LoginRegisterCms',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },



      signup_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_title_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      signup_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      signup_subtitle_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      signup_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },



      otp_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      otp_title_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      otp_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      otp_subtitle_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      otp_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },


      
      create_password_title:{
        type: DataTypes.STRING,
        allowNull: true,
      }, 
      create_password_title_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      create_password_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      create_password_subtitle_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      create_password_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },



      login_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      login_title_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      login_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      login_subtitle_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      login_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },



      recover_email_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      recover_email_title_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      recover_email_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recover_email_subtitle_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recover_email_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },



      recover_password_otp_title:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      recover_password_otp_title_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      recover_password_otp_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recover_password_otp_subtitle_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recover_password_otp_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },


      recover_password_title:{
        type: DataTypes.STRING,
        allowNull: true,
      }, 
      recover_password_title_ar:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      recover_password_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'login_register_cms', 
    }
  );

  return LoginRegisterCms;
};
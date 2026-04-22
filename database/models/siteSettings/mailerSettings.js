const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MailerSettings = sequelize.define(
    "MailerSettings",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      to_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      cc_emails: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "mailer_settings",
    },
  );

  return MailerSettings;
};

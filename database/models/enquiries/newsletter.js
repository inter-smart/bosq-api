const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const NewsLetter = sequelize.define(
    "NewsLetter",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "newsletter_enquiries",
      timestamps: true,
    },
  );

  return NewsLetter;
};

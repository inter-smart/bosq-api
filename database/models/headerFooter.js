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
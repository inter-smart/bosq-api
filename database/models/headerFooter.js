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

      address:{
        type: DataTypes.TEXT,
        allowNull: true,
      },

      phone:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      email:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      newsletter_title:{ 
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

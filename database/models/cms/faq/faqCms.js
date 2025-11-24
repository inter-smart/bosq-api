const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FaqCms = sequelize.define(
    "FaqCms",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      banner_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      banner_media_desktop_path:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
        banner_media_mobile_path:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_media_alt:{
        type: DataTypes.STRING,
        allowNull: true,
      },
     
      question_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      question_description:{
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "faq_cms",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return FaqCms;
};

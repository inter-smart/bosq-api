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

      general_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      payment_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      refund_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      product_title:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      warrenty_title:{
        type: DataTypes.STRING,
        allowNull: false,
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
      tableName: "header_footer",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return FaqCms;
};

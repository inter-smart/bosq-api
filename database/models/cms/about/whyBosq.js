const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AboutJourneys = sequelize.define(
    "AboutJourneys",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      media_path: {
        type: DataTypes.STRING,
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

      
      icon_media_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      icon_media_alt:{
        type: DataTypes.STRING,
        allowNull: true,
      },


      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },


      subtitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subtitle_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },


      description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },


      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },


      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "about_journeys",
      timestamps: true,
    }
  );
  
  return AboutJourneys;
};

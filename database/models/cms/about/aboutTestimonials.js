const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AboutTestimonials = sequelize.define(
    "AboutTestimonials",
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


      description:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },


      name:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      name_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      
      designation:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      designation_ar: {
        type: DataTypes.STRING,
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
      tableName: "about_testimonials",
      timestamps: true,
    }
  );
  
  return AboutTestimonials;
};



const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TermsAndConditionsCms = sequelize.define(
    "TermsAndConditionsCms",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
     title:{
        type: DataTypes.STRING,
        allowNull: true,
     },
     title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
     },
     description: {
        type: DataTypes.TEXT,
        allowNull: true,
     },
     description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
     },

     faq_title:{
        type: DataTypes.STRING,
        allowNull: true,
     },
     faq_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
     },
  
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "terms_and_conditions_cms",
      timestamps: true,
      deletedAt: "deleted_at",
    }
  );

  return TermsAndConditionsCms;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Faq = sequelize.define(
    "Faq",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      question: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      question_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      answer_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "faq",
      timestamps: true,
    }
  );



  return Faq;
};

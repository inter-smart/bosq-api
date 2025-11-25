const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FaqLists = sequelize.define(
    "FaqLists",
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
      category: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "faq_categories",
          key: "id",
        },
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
      tableName: "faq_lists",
      timestamps: true,
    }
  );

  FaqLists.associate = (models) => {
    FaqLists.belongsTo(models.FaqCategory, {
      foreignKey: "category",
      as: "faq_category",
    });
  };

  return FaqLists;
};

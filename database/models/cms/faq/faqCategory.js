const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FaqCategory = sequelize.define(
    "FaqCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title_ar: {
        type: DataTypes.STRING,
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
      tableName: "faq_categories",
      timestamps: true,
    }
  );

  FaqCategory.associate = (models) => {
    FaqCategory.hasMany(models.FaqList, {
      foreignKey: "category",
      as: "faq_lists",
    });
  };

  
  return FaqCategory;
};

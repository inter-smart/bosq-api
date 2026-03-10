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

      type: {
        type: DataTypes.ENUM("general", "product"),
        allowNull: false,
      },

      faq_category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "faq_categories",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      product_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "product_variants",
          key: "id",
          onDelete: "CASCADE",
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
      paranoid: true,
    },
  );

  FaqLists.associate = (models) => {
    FaqLists.belongsTo(models.FaqCategory, {
      foreignKey: "faq_category_id",
      as: "faq_category",
      onDelete: "CASCADE",
    });

    FaqLists.belongsTo(models.ProductVariants, {
      foreignKey: "product_variant_id",
      as: "product_variant",
      onDelete: "CASCADE",
    });
  };

  return FaqLists;
};

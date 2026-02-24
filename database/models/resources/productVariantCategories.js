const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductVariantCategories = sequelize.define(
    "ProductVariantCategories",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      product_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_categories",
          key: "id",
          onDelete: "CASCADE",
        },
      },
    },
    {
      tableName: "product_variant_categories",
      timestamps: true,
      paranoid: false,
    },
  );

  return ProductVariantCategories;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductVariantAttributes = sequelize.define(
    "ProductVariantAttributes",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      product_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      attribute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      attribute_value_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: "product_variant_attributes",
      timestamps: true,
      paranoid: true, // ✅ enable soft delete
    }
  );

  ProductVariantAttributes.associate = (models) => {
    ProductVariantAttributes.belongsTo(models.ProductVariants, {
      foreignKey: "product_variant_id",
    });

    ProductVariantAttributes.belongsTo(models.ProductAttribute, {
      foreignKey: "attribute_id",
    });

    ProductVariantAttributes.belongsTo(models.AttributeValues, {
      foreignKey: "attribute_value_id",
    });
  };

  return ProductVariantAttributes;
};

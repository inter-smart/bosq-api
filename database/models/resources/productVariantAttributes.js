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
        references: {
          model: "product_variants",
          key: "id",
        },
      },

      attribute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_attributes",
          key: "id",
        },
      },

      attribute_value_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "attribute_values",
          key: "id",
        },
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: "product_variant_attributes",
      timestamps: true,
      indexes: [
      {
        unique: true,
        fields: ["product_variant_id", "attribute_id", "attribute_value_id"],
      },
    ],
    },
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

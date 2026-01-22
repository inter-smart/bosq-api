const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductVariants = sequelize.define(
    "ProductVariants",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_base",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      sku: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: true,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      product_code: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: true,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "product_variants",
      timestamps: true,
      paranoid: true,
    },
  );

  ProductVariants.associate = (models) => {
    ProductVariants.belongsTo(models.ProductBase, {
      foreignKey: "product_id",
      as: "product",
    });

    // ProductVariant
    ProductVariants.belongsToMany(models.ProductAttribute, {
      through: models.ProductVariantAttributes,
      foreignKey: "product_variant_id",
      otherKey: "attribute_id",
      as: "attributes",
    });

    ProductVariants.belongsToMany(models.AttributeValues, {
      through: models.ProductVariantAttributes,
      foreignKey: "product_variant_id",
      otherKey: "attribute_value_id",
      as: "attribute_values",
    });

    ProductVariants.hasMany(models.ProductVariantAttributes, {
      foreignKey: "product_variant_id",
      as: "variant_attributes",
    });
  };

  return ProductVariants;
};

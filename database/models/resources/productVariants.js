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

      product_model_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_models",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      sku: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: true,
      },

      title: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      title_ar: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      media_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
    ProductVariants.belongsTo(models.ProductModels, {
      foreignKey: "product_model_id",
      as: "productModel",
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

    ProductVariants.hasMany(models.ProductVariantImages, {
      foreignKey: "product_variant_id",
      as: "variant_images",
      onDelete: "CASCADE",
    });

    ProductVariants.hasMany(models.Coupons, {
      foreignKey: "scope_id",
      as: "coupons",
      constraints: false,
      scope: {
        scope_type: "variant",
      },
    });

    // prodicttypes
    ProductVariants.belongsTo(models.ProductTypes, {
      foreignKey: "product_type_id",
      as: "productType",
    });
  };

  return ProductVariants;
};

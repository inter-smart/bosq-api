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

      is_featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      brochure: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      description_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      details_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      details_points: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      details_points_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      additional_details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      additional_details_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      enhance_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      enhance_title_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      sku: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      title: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      title_ar: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      design_title: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      design_title_ar: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      media_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      hover_media_path: {
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
      indexes: [
        {
          unique: true,
          fields: ["sku"],
          where: {
            deletedAt: null,
          },
          name: "product_variant_unique_sku_not_deleted",
        },
        {
          unique: true,
          fields: ["product_code"],
          where: {
            deletedAt: null,
          },
          name: "product_variant_unique_product_code_not_deleted",
        },
      ],
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

    // wishlists
    ProductVariants.hasMany(models.Wishlist, {
      foreignKey: "product_variant_id",
      as: "wishlists",
      onDelete: "CASCADE",
    });

    // Product Enquiries
    ProductVariants.hasMany(models.ProductEnquiry, {
      foreignKey: "product_id",
      as: "enquiries",
      onDelete: "CASCADE",
    });

    // Categories (many-to-many via product_variant_categories)
    ProductVariants.belongsToMany(models.ProductCategory, {
      through: models.ProductVariantCategories,
      foreignKey: "product_variant_id",
      otherKey: "category_id",
      as: "categories",
    });

    ProductVariants.hasMany(models.ProductVariantCategories, {
      foreignKey: "product_variant_id",
      as: "variantCategories",
    });

    // Bought Together (self-referential many-to-many)
    ProductVariants.belongsToMany(models.ProductVariants, {
      through: models.ProductVariantBoughtTogether,
      foreignKey: "variant_id",
      otherKey: "related_variant_id",
      as: "boughtTogetherVariants",
    });

    ProductVariants.hasMany(models.ProductProjectImage, {
      foreignKey: "product_variant_id",
      as: "projectImages",
      onDelete: "CASCADE",
    });

    ProductVariants.hasMany(models.FaqList, {
      foreignKey: "product_variant_id",
      as: "faqs",
    });
  };

  return ProductVariants;
};

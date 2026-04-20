const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductCategory = sequelize.define(
    "ProductCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
    },
    {
      tableName: "product_categories",
      timestamps: true,
      paranoid: true,

      indexes: [
        {
          unique: true,
          fields: ["slug"],
          where: {
            deletedAt: null,
          },
          name: "product_category_unique_slug_not_deleted",
        },
      ],
    },

  );

  ProductCategory.associate = (models) => {
    // Self-referencing (parent-child)
    ProductCategory.belongsTo(models.ProductCategory, {
      foreignKey: "parent_id",
      as: "parent",
    });

    ProductCategory.hasMany(models.ProductCategory, {
      foreignKey: "parent_id",
      as: "children",
    });
    ProductCategory.hasMany(models.Coupons, {
      foreignKey: "scope_id",
      as: "coupons",
      constraints: false,
      scope: {
        scope_type: "category",
      },
    });

    // Variants (many-to-many via product_variant_categories)
    ProductCategory.belongsToMany(models.ProductVariants, {
      through: models.ProductVariantCategories,
      foreignKey: "category_id",
      otherKey: "product_variant_id",
      as: "variants",
    });
  };

  return ProductCategory;
};

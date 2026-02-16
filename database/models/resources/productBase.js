const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductBase = sequelize.define(
    "ProductBase",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      title_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      enhance_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      enhance_title_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
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

      media_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      tableName: "product_base",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["slug"],
          where: {
            deletedAt: null,
          },
          name: "product_base_unique_slug_not_deleted",
        },
      ],
    },
  );

  ProductBase.associate = (models) => {
    ProductBase.belongsToMany(models.ProductSellingPoints, {
      through: models.ProductBaseSellingPoints,
      foreignKey: "product_base_id",
      otherKey: "product_selling_point_id",
      as: "sellingPoints",
    });

    ProductBase.belongsToMany(models.ProductSectors, {
      through: models.ProductBaseSectors,
      foreignKey: "product_base_id",
      otherKey: "product_sector_id",
      as: "sectors",
    });

    ProductBase.belongsTo(models.ProductCategory, {
      foreignKey: "category_id",
      as: "category",
    });

    ProductBase.hasMany(models.ProductModels, {
      foreignKey: "product_id",
      as: "models",
    });

    ProductBase.hasMany(models.ProductProjectImage, {
      foreignKey: "product_id",
      as: "projectImages",
    });

    ProductBase.hasMany(models.FaqList, {
      foreignKey: "product_id",
      as: "faqs",
    });

    ProductBase.hasMany(models.Coupons, {
      foreignKey: "scope_id",
      as: "coupons",
      constraints: false,
      scope: {
        scope_type: "product",
      },
    });
  };

  return ProductBase;
};

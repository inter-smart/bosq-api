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
        unique: true,
      },

      title_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
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

      base_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
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

    ProductBase.hasMany(models.ProductVariants, {
      foreignKey: "product_id",
      as: "variants",
    });

    ProductBase.hasMany(models.ProductProjectImage, {
      foreignKey: "product_id",
      as: "projectImages",
    });

    ProductBase.hasMany(models.FaqList, {
      foreignKey: "product_id",
      as: "faqs",
    });
  };
  

  return ProductBase;
};

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

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      title_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
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

    ProductBase.hasMany(models.ProductModels, {
      foreignKey: "product_id",
      as: "models",
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

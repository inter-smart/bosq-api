const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductSectors = sequelize.define(
    "ProductSectors",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      code: {
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
      tableName: "product_sectors",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["slug"],
          where: {
            deletedAt: null,
          },
          name: "product_sector_unique_slug_not_deleted",
        },
        {
          unique: true,
          fields: ["code"],
          where: {
            deletedAt: null,
          },
          name: "product_sector_unique_code_not_deleted",
        },
      ],
    },
  );

  ProductSectors.associate = (models) => {
    ProductSectors.belongsToMany(models.ProductBase, {
      through: models.ProductBaseSectors,
      foreignKey: "product_sector_id",
      otherKey: "product_base_id",
      as: "products",
    });
  };

  return ProductSectors;
};

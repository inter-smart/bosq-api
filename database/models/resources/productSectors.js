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
        unique: true,
      },

      code: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
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

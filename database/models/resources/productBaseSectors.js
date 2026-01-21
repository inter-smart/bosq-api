const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductBaseSectors = sequelize.define(
    "ProductBaseSectors",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      product_base_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_base",
          key: "id",
        },
      },

      product_sector_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_sectors",
          key: "id",
        },
      },
    },
    {
      tableName: "product_base_sectors",
      timestamps: true,
    }
  );

  return ProductBaseSectors;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductBaseSellingPoints = sequelize.define(
    "ProductBaseSellingPoints",
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

      product_selling_point_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_selling_points",
          key: "id",
        },
      },
    },
    {
      tableName: "product_base_selling_points",
      timestamps: true,
    }
  );

  return ProductBaseSellingPoints;
};

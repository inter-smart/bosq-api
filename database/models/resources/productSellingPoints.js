const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductSellingPoints = sequelize.define(
    "ProductSellingPoints",
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
      tableName: "product_selling_points",
      timestamps: true,
      paranoid: true,
    }
  );

  return ProductSellingPoints;
};

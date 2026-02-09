const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      variant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "order_items",
      timestamps: true,
      paranoid: true,
    },
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
      onDelete: "CASCADE",
    });

    OrderItem.belongsTo(models.ProductBase, {
      foreignKey: "product_id",
      as: "product",
    });

    OrderItem.belongsTo(models.ProductVariants, {
      foreignKey: "variant_id",
      as: "variant",
    });
  };

  return OrderItem;
};

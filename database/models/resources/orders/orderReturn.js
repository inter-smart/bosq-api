const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OrderReturn = sequelize.define(
    "OrderReturn",
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

      order_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      photos: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },

      pickup_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "completed"),
        allowNull: false,
        defaultValue: "pending",
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "order_returns",
      timestamps: true,
      paranoid: true,
    },
  );

  OrderReturn.associate = (models) => {
    OrderReturn.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
    });

    OrderReturn.belongsTo(models.OrderItem, {
      foreignKey: "order_item_id",
      as: "orderItem",
    });
  };

  return OrderReturn;
};

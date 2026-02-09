const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Orders = sequelize.define(
    "Orders",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      order_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      est_delivery_details: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"),
        allowNull: false,
        defaultValue: "pending",
      },

      payment_status: {
        type: DataTypes.ENUM("pending", "paid", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },

      payment_type: {
        type: DataTypes.ENUM("cod", "online"),
        allowNull: false,
        defaultValue: "cod",
      },

      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      discount_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      tax_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      grand_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      paranoid: true,
    },
  );

  Orders.associate = (models) => {
    Orders.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
    });

    Orders.hasMany(models.OrderItem, {
      foreignKey: "order_id",
      as: "items",
    });

    Orders.hasMany(models.OrderAddress, {
      foreignKey: "order_id",
      as: "addresses",
    });
  };

  return Orders;
};

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
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "packed",
          "shipped",
          "delivered",
          "cancelled",
          "returned",
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      payment_status: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
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

      // Network Payment Gateway fields
      network_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      order_reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      payment_method: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },

      gateway_response: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      // awb_number : string
      awb_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
        default: null,
      },
      // order_url : string
      order_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        default: null,
      },

      // partner_name : string
      partner_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        default: null,
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

    Orders.hasMany(models.PaymentTransaction, {
      foreignKey: "order_id",
      as: "payment_transactions",
    });

    Orders.hasMany(models.OrderReturn, {
      foreignKey: "order_id",
      as: "returnRequests",
    });
  };

  return Orders;
};

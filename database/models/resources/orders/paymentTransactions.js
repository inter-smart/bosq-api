"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PaymentTransaction = sequelize.define(
    "PaymentTransaction",
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

      transaction_type: {
        type: DataTypes.ENUM("charge", "refund"),
        allowNull: false,
      },

      provider: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "network_intl",
      },

      // Payment UUID from N-Genius (payment.reference)
      provider_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      // N-Genius order UUID (order.reference)
      provider_order_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },

      currency: {
        type: DataTypes.STRING(3),
        allowNull: true,
        defaultValue: "AED",
      },

      // Raw N-Genius state e.g. CAPTURED, FAILED, REFUNDED
      status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
      },

      // Internal resolved status: paid, failed, refunded, pending
      resolved_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
      },

      payment_method: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },

      auth_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
      },

      result_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
      },

      // Which path triggered this record: 'verify' or 'webhook'
      source: {
        type: DataTypes.ENUM("webhook", "verify"),
        allowNull: false,
      },

      raw_response: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "payment_transactions",
      timestamps: true,
      paranoid: false,
    },
  );

  PaymentTransaction.associate = (models) => {
    PaymentTransaction.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
    });
  };

  return PaymentTransaction;
};

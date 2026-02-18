const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CouponUsage = sequelize.define(
    "CouponUsage",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      coupon_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      coupon_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Stored for audit/history safety",
      },

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true, // NULL for guest checkout
      },

      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      used_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "coupon_usages",
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ["coupon_id"] }, { fields: ["user_id"] }, { fields: ["order_id"] }],
    },
  );

  CouponUsage.associate = (models) => {
    CouponUsage.belongsTo(models.Coupons, {
      foreignKey: "coupon_id",
      as: "coupon",
    });

    // optional but recommended
    CouponUsage.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
    });

    CouponUsage.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
    });
  };

  return CouponUsage;
};

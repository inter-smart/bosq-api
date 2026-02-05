const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Coupon = sequelize.define(
    "Coupon",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      title_ar: {
        type: DataTypes.STRING(255),
        allowNUll: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      media_path: {
        type: DataTypes.TEXT,
        allowNUll: true,
      },

      discount_type: {
        type: DataTypes.ENUM("percentage", "flat"),
        allowNull: false,
      },

      discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      min_order_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      max_discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      scope_type: {
        type: DataTypes.ENUM("common", "category", "product", "variant", "model"),
        allowNull: false,
        defaultValue: "common",
      },

      scope_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },

      usage_limit_total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      usage_limit_per_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      start_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      end_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "coupons",
      timestamps: true,
      paranoid: false, // coupons usually shouldn't be soft-deleted
      indexes: [
        { unique: true, fields: ["code"] },
        { fields: ["status"] },
        { fields: ["start_at", "end_at"] },
        { fields: ["scope_type", "scope_id"] },
      ],
    },
  );

  Coupon.associate = (models) => {
    Coupon.hasMany(models.CouponUsage, {
      foreignKey: "coupon_id",
      as: "usages",
      onDelete: "CASCADE",
    });
  };

  return Coupon;
};

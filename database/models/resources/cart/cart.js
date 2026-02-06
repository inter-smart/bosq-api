const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("active", "ordered", "abandoned"),
        allowNull: false,
        defaultValue: "active",
      },

      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
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

      applied_coupon_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: "carts",
      timestamps: true, // creates createdAt & updatedAt
      paranoid: true,
    },
  );

  Cart.associate = (models) => {
    Cart.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
    });

    Cart.hasMany(models.CartItems, {
      foreignKey: "cart_id",
      as: "items",
    });

    Cart.hasMany(models.CartAddress, {
      foreignKey: "cart_id",
      as: "addresses",
    });
  };

  return Cart;
};

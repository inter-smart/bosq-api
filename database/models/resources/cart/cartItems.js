const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CartItem = sequelize.define(
    "CartItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      variant_id: {
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
      tableName: "cart_items",
      timestamps: true,
    },
  );

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Cart, {
      foreignKey: "cart_id",
      as: "cart",
      onDelete: "CASCADE",
    });

    CartItem.belongsTo(models.ProductBase, {
      foreignKey: "product_id",
      as: "product",
    });

    CartItem.belongsTo(models.ProductVariants, {
      foreignKey: "variant_id",
      as: "variant",
    });
  };

  return CartItem;
};

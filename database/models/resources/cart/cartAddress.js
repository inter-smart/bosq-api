const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CartAddress = sequelize.define(
    "CartAddress",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      address_type: {
        type: DataTypes.ENUM("billing", "shipping"),
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      company_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },

      country_code: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: "+91",
      },

      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      street_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      apartment: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      state_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "states",
          key: "id",
        },
      },

      order_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      parent_address_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "cart_address",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
    },
    {
      tableName: "cart_address",
      timestamps: true,
      underscored: true,
    },
  );

  CartAddress.associate = (models) => {
    // One billing → one shipping
    CartAddress.hasOne(models.CartAddress, {
      foreignKey: "parent_address_id",
      as: "shipping_CartAddress",
    });

    // Shipping belongs to billing
    CartAddress.belongsTo(models.CartAddress, {
      foreignKey: "parent_address_id",
      as: "billing_CartAddress",
    });

    // state and country
    CartAddress.belongsTo(models.State, {
      foreignKey: "state_id",
      as: "state",
    });
  };

  return CartAddress;
};

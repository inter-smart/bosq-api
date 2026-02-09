const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OrderAddress = sequelize.define(
    "OrderAddress",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },

      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
        onDelete: "CASCADE",
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

      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
      },
    },
    {
      tableName: "order_address",
      timestamps: true,
      underscored: true,
    },
  );

  OrderAddress.associate = (models) => {
    OrderAddress.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
      onDelete: "CASCADE",
    });

    OrderAddress.belongsTo(models.State, {
      foreignKey: "state_id",
      as: "state",
    });
  };

  return OrderAddress;
};

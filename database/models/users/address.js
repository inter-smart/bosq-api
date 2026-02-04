const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Address = sequelize.define(
    "Address",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
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

      parent_address_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "address",
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
      tableName: "address",
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["user_id", "address_type"] },
        { fields: ["user_id", "is_default"] },
        { fields: ["status"] },
      ],
    },
  );

  Address.associate = (models) => {
    Address.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
    });

    // One billing → one shipping
    Address.hasOne(models.Address, {
      foreignKey: "parent_address_id",
      as: "shipping_address",
    });

    // Shipping belongs to billing
    Address.belongsTo(models.Address, {
      foreignKey: "parent_address_id",
      as: "billing_address",
    });

    // state and country
    Address.belongsTo(models.State, {
      foreignKey: "state_id",
      as: "state",
    });

  };

  return Address;
};

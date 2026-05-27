const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const StateDeliveryRules = sequelize.define(
    "StateDeliveryRules",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      state_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "states",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "product_categories",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      charge: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      is_free: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "state_delivery_rules",
      timestamps: true,
      underscored: true,
    }
  );

  StateDeliveryRules.associate = (models) => {
    StateDeliveryRules.belongsTo(models.State, {
      foreignKey: "state_id",
      as: "state",
    });

    StateDeliveryRules.belongsTo(models.ProductCategory, {
      foreignKey: "category_id",
      as: "category",
    });
  };

  return StateDeliveryRules;
};

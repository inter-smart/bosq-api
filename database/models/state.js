const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const State = sequelize.define(
    "State",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      slug: {
        type: DataTypes.STRING(150),
        allowNull: true,
        unique: true,
      },

      country_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "states",
      timestamps: true,
      paranoid: true,
    }
  );

  State.associate = (models) => {
    State.belongsTo(models.Country, {
      foreignKey: "country_id",
      as: "country",
      onDelete: "CASCADE",
    });


    // address
    State.hasMany(models.Address, {
      foreignKey: "state_id",
      as: "addresses",
      onDelete: "CASCADE",
    });

    // customizationfrom
    State.hasMany(models.CustomizationEnquiry, {
      foreignKey: "state_id",
      as: "customization_form",
      onDelete: "CASCADE",
    });

    // delivery rules
    State.hasMany(models.StateDeliveryRules, {
      foreignKey: "state_id",
      as: "delivery_rules",
      onDelete: "CASCADE",
    });
  };

  return State;
};

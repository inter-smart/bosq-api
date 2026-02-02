const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Country = sequelize.define(
    "Country",
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

      status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1, // ACTIVE
      },

      meta_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "countries",
      timestamps: true,
      paranoid: true,
    }
  );

  Country.associate = (models) => {
    Country.hasMany(models.State, {
      foreignKey: "country_id",
      as: "states",
      onDelete: "CASCADE",
    });
  };

  return Country;
};

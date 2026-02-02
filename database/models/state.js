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
        references: {
          model: "countries",
          key: "id",
        },
        onDelete: "CASCADE",
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

      targeted_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      other_meta_tags: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      canonical_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      og_image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      og_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      og_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      twitter_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      twitter_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      twitter_image: {
        type: DataTypes.TEXT,
        allowNull: true,
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
  };

  return State;
};

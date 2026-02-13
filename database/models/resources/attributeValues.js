const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AttributeValues = sequelize.define(
    "AttributeValues",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      attribute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_attributes",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      value: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      media_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      value_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "attribute_values",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["slug"],
          where: {
            deletedAt: null,
          },
          name: "attribute_values_unique_slug_not_deleted",
        },
      ],
    },
  );

  AttributeValues.associate = (models) => {
    AttributeValues.belongsTo(models.ProductAttribute, {
      foreignKey: "attribute_id",
      as: "attribute",
    });

    AttributeValues.belongsToMany(models.ProductVariants, {
      through: models.ProductVariantAttributes,
      foreignKey: "attribute_value_id",
      otherKey: "product_variant_id",
      as: "variants",
    });
  };

  return AttributeValues;
};

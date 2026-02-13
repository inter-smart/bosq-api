const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductAttribute = sequelize.define(
    "ProductAttribute",
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

      name_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      code: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
      tableName: "product_attributes",
      timestamps: true,
      paranoid: true,

      indexes: [
        {
          unique: true,
          fields: ["slug"],
          where: {
            deletedAt: null,
          },
          name: "product_attribute_unique_slug_not_deleted",
        },
        {
          unique: true,
          fields: ["code"],
          where: {
            deletedAt: null,
          },
          name: "product_attribute_unique_code_not_deleted",
        },
      ],
    },



  );

  ProductAttribute.associate = (models) => {
    ProductAttribute.hasMany(models.AttributeValues, {
      foreignKey: "attribute_id",
      as: "values",
      onDelete: "CASCADE",
    });

    ProductAttribute.belongsToMany(models.ProductVariants, {
      through: models.ProductVariantAttributes,
      foreignKey: "attribute_id",
      otherKey: "product_variant_id",
      as: "variants",
    });
  };

  return ProductAttribute;
};

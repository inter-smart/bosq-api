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
        unique: true,
      },

      name_ar: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },

      code: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
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

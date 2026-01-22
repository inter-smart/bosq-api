const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductVariantImages = sequelize.define(
    "ProductVariantImages",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      product_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
        },
      },

      media_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      media_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
    },
    {
      tableName: "product_variant_images",
      timestamps: true,
      paranoid: true,
    },
  );

  ProductVariantImages.associate = (models) => {
    ProductVariantImages.belongsTo(models.ProductVariants, {
      foreignKey: "product_variant_id",
      as: "product_variant",
    });
  };

  return ProductVariantImages;
};

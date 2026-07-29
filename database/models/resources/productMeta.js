const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductMeta = sequelize.define(
    "ProductMeta",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        onDelete: "CASCADE",
        references: {
          model: "product_variants",
          key: "id",
        },
      },
      product_slug: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      meta_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_title_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      other_meta: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      other_meta_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "product_meta",
      timestamps: true,
    },
  );

  ProductMeta.associate = (models) => {
    ProductMeta.belongsTo(models.ProductVariants, {
      foreignKey: "product_variant_id",
      as: "productVariant",
      onDelete: "CASCADE",
    });
  };

  return ProductMeta;
};

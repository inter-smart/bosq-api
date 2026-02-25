const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductVariantBoughtTogether = sequelize.define(
    "ProductVariantBoughtTogether",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      variant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      related_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
          onDelete: "CASCADE",
        },
      },
    },
    {
      tableName: "product_variant_bought_together",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ["variant_id", "related_variant_id"],
          name: "product_variant_bought_together_unique",
        },
      ],
    },
  );

  return ProductVariantBoughtTogether;
};

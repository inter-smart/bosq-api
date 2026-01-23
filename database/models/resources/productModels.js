const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductModels = sequelize.define(
    "ProductModels",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product_base",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      title_ar: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },

      code: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },

      media_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },

      base_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "product_models",
      timestamps: true,
      paranoid: true,
    },
  );

  ProductModels.associate = (models) => {
    ProductModels.hasMany(models.ProductVariants, {
      foreignKey: "product_model_id",
      as: "variants",
    });

    ProductModels.belongsTo(models.ProductBase, {
      foreignKey: "product_id",
      as: "product",
    });
  };

  return ProductModels;
};

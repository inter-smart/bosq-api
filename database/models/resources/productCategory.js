const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductCategory = sequelize.define(
    "ProductCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "product_categories",
      timestamps: true,
    },
  );

  ProductCategory.associate = (models) => {
    // Self-referencing (parent-child)
    ProductCategory.belongsTo(models.ProductCategory, {
      foreignKey: "parent_id",
      as: "parent",
    });

    ProductCategory.hasMany(models.ProductCategory, {
      foreignKey: "parent_id",
      as: "children",
    });
    ProductCategory.hasMany(models.Coupons, {
      foreignKey: "scope_id",
      as: "coupons",
      constraints: false,
      scope: {
        scope_type: "category",
      },
    });
  };

  return ProductCategory;
};

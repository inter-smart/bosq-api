const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductProjectImage = sequelize.define(
    "ProductProjectImage",
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

      media_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      media_alt: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      media_alt_ar: {
        type: DataTypes.STRING(255),
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
      tableName: "product_project_images",
      timestamps: true,
      paranoid: true,
    },
  );


  ProductProjectImage.associate = (models) => {
    ProductProjectImage.belongsTo(models.ProductBase, {
      foreignKey: "product_id",
      as: "product",
    });
  };

  return ProductProjectImage;
};

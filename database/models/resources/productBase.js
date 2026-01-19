const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductBase = sequelize.define(
    "ProductBase",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      details_points: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      additional_details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      media_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      tableName: "product_base",
      timestamps: true,
      paranoid: true,
    }
  );

  ProductBase.associate = (models) => {
    ProductBase.belongsToMany(models.ProductSellingPoints, {
      through: models.ProductBaseSellingPoints,
      foreignKey: "product_base_id",
      otherKey: "product_selling_point_id",
      as: "sellingPoints",
    });
  };

  return ProductBase;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductEnquiry = sequelize.define(
    "ProductEnquiry",
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
          model: "product_variants",
          key: "id",
          onDelete: "CASCADE",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "product_enquiries",
    },
  );

  ProductEnquiry.associate = (models) => {
    ProductEnquiry.belongsTo(models.ProductVariants, {
      foreignKey: "product_id",
      as: "product",
    });
  };

  return ProductEnquiry;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductSellingPoints = sequelize.define(
    "ProductSellingPoints",
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
        allowNull: false,
      },

      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
      tableName: "product_selling_points",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["slug"],
          where: {
            deletedAt: null,
          },
          name: "product_selling_point_unique_slug_not_deleted",
        },
      ],
    }
  );

  ProductSellingPoints.associate = (models) => {
    ProductSellingPoints.belongsToMany(models.ProductBase, {
      through: models.ProductBaseSellingPoints,
      foreignKey: "product_selling_point_id",
      otherKey: "product_base_id",
      as: "productBases",
    });
  };

  return ProductSellingPoints;
};

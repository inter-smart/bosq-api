const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductTypes = sequelize.define(
    "ProductTypes",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      title_ar: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media_desktop_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media_mobile_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
      },

      landing_page_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "landing_page",
          key: "id",
        },
      },

      product_variants: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: [],
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "product_types",
      timestamps: true,
    },
  );

  ProductTypes.associate = (models) => {
    ProductTypes.belongsTo(models.LandingPage, {
      foreignKey: "landing_page_id",
      as: "landingPage",
    });
  };

  return ProductTypes;
};

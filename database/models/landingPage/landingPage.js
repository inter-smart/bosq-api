const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const LandingPage = sequelize.define(
    "LandingPage",
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
      button_label: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      button_label_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      link: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      slug: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
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

      show_in_footer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      meta_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_title_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description_ar: {
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
      tableName: "landing_page",
      timestamps: true,
    },
  );

  LandingPage.associate = function (models) {
    LandingPage.hasMany(models.ProductTypes, {
      foreignKey: "landing_page_id",
      as: "productTypes",
    });
  };

  return LandingPage;
};

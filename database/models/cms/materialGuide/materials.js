const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Materials = sequelize.define(
    "Materials",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      category:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "material_categories",
          key: "id",
          onDelete: "CASCADE",
        },
      },

      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      media_path: {
        type: DataTypes.STRING,
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

      icon_path:{
        type: DataTypes.STRING,
        allowNull: true,
      },

      sort_order: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "materials",
      timestamps: true,
    }
  );


  Materials.associate = (models) => {
    Materials.belongsTo(models.MaterialCategories, {
      foreignKey: "category",
      as: "material_categories",
      onDelete: "CASCADE",
    });
  };

  return Materials;
};

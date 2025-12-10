const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MaterialCategory = sequelize.define(
    "MaterialCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      title_ar: {
        type: DataTypes.STRING,
        allowNull: false,
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "material_categories",
      timestamps: true,
    }
  );

  MaterialCategory.associate = (models) => {
    MaterialCategory.hasMany(models.Materials, {
      foreignKey: "category",
      as: "materials",
      onDelete: "CASCADE",
      
    });
  };

  return MaterialCategory;
};

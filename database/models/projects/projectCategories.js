const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProjectCategories = sequelize.define(
    "ProjectCategories",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      slug:{
        type: DataTypes.STRING,
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
      tableName: "project_categories",
      timestamps: true,
      paranoid: true,
    }
  );

  ProjectCategories.associate = (models) => {
    ProjectCategories.hasMany(models.Projects, {
      foreignKey: "category_id",
      as: "projects",
      onDelete: "CASCADE",
    });
  };

  return ProjectCategories;
};

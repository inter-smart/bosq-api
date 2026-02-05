const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProjectImage = sequelize.define(
    "ProjectImage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "projects", key: "id" },
      },

      media_alt_ar: {
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
      tableName: "Project_images",
      timestamps: true,
      paranoid: true,
    },
  );

  ProjectImage.associate = (models) => {
    ProjectImage.belongsTo(models.Projects, {
      foreignKey: "project_id",
      as: "projects",
      onDelete: "CASCADE",
    });
  };

  return ProjectImage;
};

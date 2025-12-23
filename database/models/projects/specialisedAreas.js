const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SpecialisedAreas = sequelize.define(
    "SpecialisedAreas",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "projects",
          key: "id",
        },
        onDelete: "CASCADE",
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
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title_ar: {
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "specialised_areas",
      timestamps: true,
    }
  );

  SpecialisedAreas.associate = (models) => {
    SpecialisedAreas.belongsTo(models.Projects, {
      foreignKey: "project_id",
      as: "projects",
      onDelete: "CASCADE",
    });
  };

  return SpecialisedAreas;
};

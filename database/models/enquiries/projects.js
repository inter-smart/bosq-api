const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProjectEnquiry = sequelize.define(
    "ProjectEnquiry",
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
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "project_enquiries",
    },
  );


  ProjectEnquiry.associate = (models) => {
    ProjectEnquiry.belongsTo(models.Projects, {
      foreignKey: "project_id",
      as: "project",
    });
  }

  return ProjectEnquiry;
};

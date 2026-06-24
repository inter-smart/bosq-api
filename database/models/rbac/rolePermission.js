const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
          onDelete: "CASCADE",
        },
      },
      permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "permissions",
          key: "id",
          onDelete: "CASCADE",
        },
      },
    },
    {
      tableName: "role_permissions",
      timestamps: true,
    },
  );

  return RolePermission;
};

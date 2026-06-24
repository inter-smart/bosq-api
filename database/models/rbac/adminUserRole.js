const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AdminUserRole = sequelize.define(
    "AdminUserRole",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      admin_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "admin_users",
          key: "id",
          onDelete: "CASCADE",
        },
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
    },
    {
      tableName: "admin_user_roles",
      timestamps: true,
    },
  );

  return AdminUserRole;
};

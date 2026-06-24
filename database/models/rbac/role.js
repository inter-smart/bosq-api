const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "roles",
      timestamps: true,
    },
  );

  Role.associate = (models) => {
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: "role_id",
      otherKey: "permission_id",
      as: "permissions",
    });

    Role.belongsToMany(models.AdminUser, {
      through: models.AdminUserRole,
      foreignKey: "role_id",
      otherKey: "admin_user_id",
      as: "adminUsers",
    });
  };

  return Role;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminUser = sequelize.define(
    'AdminUser',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'admin_users',
    }
  );

  AdminUser.associate = (models) => {
    AdminUser.belongsToMany(models.Role, {
      through: models.AdminUserRole,
      foreignKey: "admin_user_id",
      otherKey: "role_id",
      as: "roles",
    });
  };

  return AdminUser;
};
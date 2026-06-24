const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Permission = sequelize.define(
    "Permission",
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
      module: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "permissions",
      timestamps: true,
    },
  );

  Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: "permission_id",
      otherKey: "role_id",
      as: "roles",
    });
  };

  return Permission;
};

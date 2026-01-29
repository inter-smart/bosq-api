const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AuthSessions = sequelize.define(
    "AuthSessions",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      access_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "auth_sessions",
      timestamps: false,
      underscored: true,
    }
  );

  AuthSessions.asociate = (models) => {
    AuthSessions.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return AuthSessions;
};
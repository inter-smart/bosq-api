const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Users = sequelize.define(
    "Users",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      slug:{
        type: DataTypes.STRING(150),
        allowNull: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      country_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },

      mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      password: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      mobile_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      status: {
        type: DataTypes.STRING(20),
        defaultValue: "active",
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users",
      timestamps: false,
      underscored: true,
    },
  );


  Users.associate = (models) => {
    Users.hasMany(models.Otps, {
      foreignKey: "user_id",
      as: "otp",
      onDelete: "CASCADE",
    });

    Users.hasMany(models.AuthSessions, {
      foreignKey: "user_id",
      as: "auth_sessions",
      onDelete: "CASCADE",
    })
  };




  return Users;
};

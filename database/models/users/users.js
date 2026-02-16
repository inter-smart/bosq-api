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

      first_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      slug:{
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
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

      profile_image:{
        type: DataTypes.TEXT,
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

    Users.hasMany(models.Address, {
      foreignKey: "user_id",
      as: "addresses",
      onDelete: "CASCADE",
    })

    Users.hasMany(models.Wishlist, {
      foreignKey: "user_id",
      as: "wishlists",
      onDelete: "CASCADE",
    })

  };




  return Users;
};

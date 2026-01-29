const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Otps = sequelize.define(
    "Otps",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
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

      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      otp_code: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },

      purpose: {
        type: DataTypes.STRING(30),
        allowNull: false,
        comment: "register, login, forgot_password",
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "otps",
      timestamps: false,   // because only created_at exists
      underscored: true,
    }
  );


  Otps.associate = (models) => {
    Otps.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return Otps;
};

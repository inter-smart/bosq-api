const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SocialAccounts = sequelize.define(
    "SocialAccounts",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // user_id: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: "users",
      //     key: "id",
      //   },
      //   onDelete: "CASCADE",
      // },

      provider: {
        type: DataTypes.STRING(30),
        allowNull: false,
        comment: "google",
      },

      provider_user_id: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "social_accounts",
      timestamps: false,
      underscored: true,

      indexes: [
        {
          unique: true,
          fields: ["provider", "provider_user_id"],
        },
      ],
    }
  );



  // SocialAccounts.associate = (models) => {
  //   SocialAccounts.belongsTo(models.Users, {
  //     foreignKey: "user_id",
  //     as: "user",
  //   });
  // };

  return SocialAccounts;
};

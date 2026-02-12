const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UsersWishList = sequelize.define(
    "UsersWishList",
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

      product_variant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "users_wish_list",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "product_variant_id"],
        },
        {
          fields: ["user_id"],
        },
        {
          fields: ["product_variant_id"],
        },
      ],
    },
  );

  UsersWishList.associate = (models) => {
    UsersWishList.belongsTo(models.Users, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });

    UsersWishList.belongsTo(models.ProductVariants, {
      foreignKey: "product_variant_id",
      as: "variant",
      onDelete: "CASCADE",
    });
  };

  return UsersWishList;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SocialMedia = sequelize.define(
    "SocialMedia",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      icon_media_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      icon_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      icon_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      link: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "social_media",
      timestamps: true,
      deletedAt: "deleted_at",
    }
  );

  return SocialMedia;
};

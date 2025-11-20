const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MetaTags = sequelize.define(
    "MetaTags",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      page: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      meta_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
     
      other_meta_tags: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "meta_tags",
      timestamps: true,
      deletedAt: "deleted_at",
    }
  );

  return MetaTags;
};

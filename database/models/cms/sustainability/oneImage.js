const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SustainabilityOneImages = sequelize.define(
    "SustainabilityOneImages",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      points: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      points_ar: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      image_path: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "sustainability_one_images",
    }
  );

  return SustainabilityOneImages;
};

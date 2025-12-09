const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DeliveryTime = sequelize.define(
    "DeliveryTime",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      icon_media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      duration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      duration_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      title_ar: {
        type: DataTypes.TEXT,
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
      tableName: "delivery_time",
      timestamps: true,
    }
  );

  return DeliveryTime;
};

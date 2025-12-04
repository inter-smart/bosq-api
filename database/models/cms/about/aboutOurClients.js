const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AboutOurClients = sequelize.define(
    "AboutOurClients",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title_ar: {
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
      tableName: "about_our_clients",
      timestamps: true,
    }
  );
  
  return AboutOurClients;
};

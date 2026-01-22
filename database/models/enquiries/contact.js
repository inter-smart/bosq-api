const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ContactEnquiry = sequelize.define(
    "ContactEnquiry",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "contact_enquiries",
    },
  );

  return ContactEnquiry;
};

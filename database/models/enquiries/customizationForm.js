const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CustomizationEnquiry = sequelize.define(
    "CustomizationEnquiry",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      company_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dropdown_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        reference:{
          model: "enquiry_dropdown",
          key: "id",
          onDelete: "CASCADE",
        }
      },
      state_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "customization_enquiries",
      timestamps: true,
    },
  );


  CustomizationEnquiry.associate = (models) => {
    CustomizationEnquiry.belongsTo(models.EnquiryDropdown, {
      foreignKey: "dropdown_id",
      as: "dropdown",
      onDelete: "CASCADE",
    });

    // state
    CustomizationEnquiry.belongsTo(models.State, {
      foreignKey: "state_id",
      as: "state",
      onDelete: "CASCADE",
    });
  }

  return CustomizationEnquiry;
};

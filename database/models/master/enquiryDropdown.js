const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const EnquiryDropdown = sequelize.define(
    "EnquiryDropdown",
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
      sort_order: {
        type: DataTypes.SMALLINT,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "enquiry_dropdown",
      timestamps: true,
    },
  )


  EnquiryDropdown.associate =(models) =>{
    EnquiryDropdown.hasMany(models.CustomizationEnquiry, {
      foreignKey: "dropdown_id",
      as: "enquiries",
    })
  }

  return EnquiryDropdown;
};

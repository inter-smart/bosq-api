const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Policy = sequelize.define(
        "Policy",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            slug: {
                type: DataTypes.ENUM("privacy-policy", "terms-and-conditions"),
                allowNull: true,
            },
            banner_title: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            banner_media_desktop_path: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            banner_media_mobile_path: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            banner_media_alt: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
           
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            
            deletedAt: {
                type: DataTypes.DATE,
            },
        },
        {
            tableName: "policy",
            timestamps: true,
        }
    );

    return Policy;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Projects = sequelize.define(
    "Projects",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "project_categories",
          key: "id",
        },
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
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section1_desktop_media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section1_mobile_media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section1_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section1_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section2_first_media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section2_first_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section2_first_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section2_second_media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section2_second_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section2_second_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section3_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section3_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section3_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      section3_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      section3_media_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section3_media_alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section3_media_alt_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section4_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section4_title_ar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
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
      meta_title_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      features: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      tags_ar: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      features_ar: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      show_in_home: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      tableName: "projects",
      timestamps: true,
      paranoid: true,
    }
  );

  Projects.associate = (models) => {
    Projects.belongsTo(models.ProjectCategories, {
      foreignKey: "category_id",
      as: "project_categories",
      onDelete: "CASCADE",
    });

    Projects.hasMany(models.SpecialisedAreas, {
      foreignKey: "project_id",
      as: "specialised_areas",
      onDelete: "CASCADE",
    });
  };

  return Projects;
};

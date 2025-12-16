const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../../traits/responseHandler");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../middleware/multerMiddleware");
const { paginate } = require("../../traits/datatablePaginationHelper");
const slugify = require("slugify");
const { Op } = require("sequelize");
const { validateProjects, validateId } = require("../../request/projects/projectsRequest");

const DataModel = models.Projects;

class ProjectsController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["slug"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Project retrieved successfully");
    } catch (error) {
      console.error("Project index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Create project
  static async store(req, res) {
    await Promise.all(validateProjects.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { title } = req.body;

      if (!title || title.trim() === "") return sendErrorResponse(res, "Title is required to generate slug", null, 400);

      let baseSlug = req.body.slug;

      const existing = await DataModel.findOne({
        where: { slug: baseSlug },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, `Slug "${baseSlug}" already exists`, { existing_id: existing.id }, 409);
      }

      req.body.slug = baseSlug;

      // ✅ Handle file uploads
      const fileFields = [
        "thumbnail",
        "section1_desktop_media_path",
        "section1_mobile_media_path",
        "section2_first_media_path",
        "section2_second_media_path",
        "section3_media_path",
      ];

      handleFileUploadStore(req, fileFields);

      // Parsing JSONB fields

      const jsonbFields = ["tags", "tags_ar", "features", "features_ar"];
      jsonbFields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          req.body[field] = JSON.parse(req.body[field]);
        }
      });

      // ✅ Create project

      const project = await DataModel.create(req.body, { transaction });

      await transaction.commit();

      // Fetch with association
      const createdData = await DataModel.findByPk(project.id);

      sendSuccessResponse(res, createdData, "Project created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Project creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Get single project
  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) return sendNotFoundError(res, "Project");

      sendSuccessResponse(res, data, "Project retrieved successfully");
    } catch (error) {
      console.error("Project show error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Update project
  static async update(req, res) {
    await Promise.all([...validateId, ...validateProjects].map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { title } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Project");
      }

      // ✅ Slug validation + prevent duplicates
      if (title && title.trim() !== data.title) {
        const newSlug = slugify(title.trim(), { lower: true, strict: true });

        // Check if slug exists for OTHER project
        const existing = await DataModel.findOne({
          where: {
            slug: { [Op.iLike]: newSlug },
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });

        if (existing) {
          await transaction.rollback();
          return sendErrorResponse(res, `Slug "${newSlug}" already exists`, { existing_id: existing.id }, 409);
        }

        req.body.slug = newSlug;
      }

      // -----------------------------------------
      // ✅ File uploads handling
      // -----------------------------------------
      const fileFields = [
        "thumbnail",
        "section1_desktop_media_path",
        "section1_mobile_media_path",
        "section2_first_media_path",
        "section2_second_media_path",
        "section3_media_path",
      ];

      await handleFileUploadUpdate(req, data, fileFields);

      // Parsing JSONB fields
      const jsonbFields = ["tags", "tags_ar", "features", "features_ar"];
      jsonbFields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          req.body[field] = JSON.parse(req.body[field]);
        }
      });

      // -----------------------------------------
      // ✅ Update database
      // -----------------------------------------
      await data.update(req.body, { transaction });
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);

      sendSuccessResponse(res, updatedData, "Project updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Project update error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Delete project
  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) return sendNotFoundError(res, "Project");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Project deleted successfully");
    } catch (error) {
      console.error("Project deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProjectsController;

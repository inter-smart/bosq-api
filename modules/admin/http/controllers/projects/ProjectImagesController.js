const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler");
const {
  handleFileUploadStore,
  handleFileUploadUpdate,
} = require("../../middleware/multerMiddleware");
const { paginate } = require("../../traits/datatablePaginationHelper");
const slugify = require("slugify");
const { Op } = require("sequelize");
const {
  validateProjects,
  validateId,
  validateRequestPost,
} = require("../../request/projects/projetImagesRequest.js");

const DataModel = models.ProjectImage;

class ProjectsImageController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["media_alt"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(
        res,
        response,
        "Project image retrieved successfully",
      );
    } catch (error) {
      console.error("Project image index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Create projectImages
  static async store(req, res) {
    await Promise.all(validateRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { project_id } = req.body;

      if (!project_id) {
        await transaction.rollback();
        return sendValidationError(res, [
          { field: "project_id", message: "Project id is required" },
        ]);
      }

      // // ✅ 1. Verify parent exists
      const project = await models.Projects.findByPk(project_id, {
        transaction,
      });
      if (!project) {
        await transaction.rollback();
        return sendNotFoundError(res, "Project not found");
      }

      // ✅ 2. Handle uploads AFTER validation
      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      // ✅ 3. Create record
      const projectImage = await DataModel.create(req.body, { transaction });

      await transaction.commit();

      const createdData = await DataModel.findByPk(projectImage.id);

      return sendSuccessResponse(
        res,
        createdData,
        "Project image created successfully",
        201,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Project image creation error:", error);
      return sendErrorResponse(res, error);
    }
  }

  // ✅ Get single projectImages
  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) return sendNotFoundError(res, "Project image");

      sendSuccessResponse(res, data, "Project image retrieved successfully");
    } catch (error) {
      console.error("Project image show error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Update projectImages
  static async update(req, res) {
    await Promise.all(
      [...validateId, ...validateRequestPost].map((v) => v.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Project image Image");
      }

      // -----------------------------------------
      // ✅ File uploads handling
      // -----------------------------------------
      const fileFields = ["media_path"];

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

      sendSuccessResponse(
        res,
        updatedData,
        "Project image updated successfully",
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Project image update error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Delete projectImages
  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) return sendNotFoundError(res, "Project image");

      await data.destroy();

      sendSuccessResponse(res, { id }, "Project image deleted successfully");
    } catch (error) {
      console.error("Project image deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProjectsImageController;

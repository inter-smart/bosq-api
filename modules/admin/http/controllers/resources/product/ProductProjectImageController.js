const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const {
  validationRequestPost,
  validateId,
} = require("../../../request/resources/productProjectImageRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const {
  sendSuccessResponse,
  sendErrorResponse,
  sendValidationError,
  sendNotFoundError,
} = require("../../../traits/responseHandler");
const { validationResult, param } = require("express-validator");
const { Op } = require("sequelize");
const {
  handleFileUploadStore,
  handleFileUploadUpdate,
} = require("../../../middleware/multerMiddleware");

const DataModel = models.ProductProjectImage;

class ProductProjectImageController {
  static async index(req, res) {
    try {

      const {product_id} = req.query;

      const result = await paginate(DataModel, req, {
        where: {
          product_id
        },
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["media_alt", "media_alt_ar"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(
        res,
        response,
        "Project images retrieved successfully",
      );
    } catch (error) {
      console.error("Project images index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const projectImage = await DataModel.create(req.body, {
        transaction,
      });
      await transaction.commit();
      const createdData = await DataModel.findByPk(projectImage.id);

      sendSuccessResponse(
        res,
        createdData,
        "Project image created successfully",
        201,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Project image creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) return sendNotFoundError(res, "Project image");

      sendSuccessResponse(
        res,
        data,
        "Project image retrieved successfully",
      );
    } catch (error) {
      console.error("Project image show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all(
      [...validateId, ...validationRequestPost].map((v) => v.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Project image");
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

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

  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) return sendNotFoundError(res, "Project image");

      await data.destroy();
      sendSuccessResponse(
        res,
        { id },
        "Project image deleted successfully",
      );
    } catch (error) {
      console.error("Project image deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductProjectImageController;

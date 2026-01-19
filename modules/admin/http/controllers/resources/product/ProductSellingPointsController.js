const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productSellingPointsRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");

const DataModel = models.ProductSellingPoints;

class ProductSellingPointsController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["name", "slug"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product Selling Points retrieved successfully");
    } catch (error) {
      console.error("Product Selling Points index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { name } = req.body;

      if (!name || name.trim() === "") return sendErrorResponse(res, "Name is required to generate slug", null, 400);

      const newSlug = slugify(name.trim(), { lower: true, strict: true });

      const existing = await DataModel.findOne({
        where: {
          [Op.or]: [{ slug: newSlug }, { name: name.trim() }],
        },
        paranoid: false,
      });

      if (existing) {
        await transaction.rollback();
        if (existing.slug === newSlug) {
          return sendErrorResponse(res, `Slug "${newSlug}" already exists`, { existing_id: existing.id }, 409);
        }
        return sendErrorResponse(res, `Name "${name}" already exists`, { existing_id: existing.id }, 409);
      }

      req.body.slug = newSlug;

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const productSellingPoint = await DataModel.create(req.body, { transaction });
      await transaction.commit();

      const createdData = await DataModel.findByPk(productSellingPoint.id);

      sendSuccessResponse(res, createdData, "Product Selling Point created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product Selling Point creation error:", error);
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

      if (!data) return sendNotFoundError(res, "Product Selling Point");

      sendSuccessResponse(res, data, "Product Selling Point retrieved successfully");
    } catch (error) {
      console.error("Product Selling Point show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all([...validateId, ...validationRequestPost].map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { name } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Selling Point");
      }

      if (name && name.trim() !== data.name) {
        const newSlug = slugify(name.trim(), { lower: true, strict: true });

        const existingSlug = await DataModel.findOne({
          where: {
            slug: newSlug,
            id: { [Op.ne]: id },
          },
          paranoid: false,
        });

        if (existingSlug) {
          await transaction.rollback();
          return sendErrorResponse(res, `Slug "${newSlug}" already exists`, { existing_id: existingSlug.id }, 409);
        }

        req.body.slug = newSlug;
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      await data.update(req.body, { transaction });
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);

      sendSuccessResponse(res, updatedData, "Product Selling Point updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Selling Point update error:", error);
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
      if (!data) return sendNotFoundError(res, "Product Selling Point");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Product Selling Point deleted successfully");
    } catch (error) {
      console.error("Product Selling Point deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductSellingPointsController;

const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productModelsRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");
const { default: slugify } = require("slugify");
const { updateVariantsPrices } = require("../../../traits/ProductVariantHelper");

const DataModel = models.ProductModels;

class ProductModelsController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["title", "title_ar"],
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
          {
            model: models.ProductBase,
            as: "product",
            attributes: ["id", "title", "slug"],
          },
        ],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product models retrieved successfully");
    } catch (error) {
      console.error("Product models index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { product_id, title, code } = req.body;

      const product = await models.ProductBase.findByPk(product_id);
      if (!product) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product");
      }

      if (!title || title.trim() === "") return sendErrorResponse(res, "Title is required to generate slug", null, 400);

      const newSlug = slugify(title.trim(), { lower: true, strict: true });

      const existing = await DataModel.findOne({
        where: { slug: newSlug },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, `Slug "${newSlug}" already exists`, { existing_id: existing.id }, 409);
      }

      if (code && code.trim() !== "") {
        const existingCode = await DataModel.findOne({
          where: { code: code.trim() },
          paranoid: true,
        });
        if (existingCode) {
          await transaction.rollback();
          return sendErrorResponse(res, `Code "${code}" already exists`, { existing_id: existingCode.id }, 409);
        }
      }

      req.body.slug = newSlug;

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const productModel = await DataModel.create(req.body, {
        transaction,
      });
      await transaction.commit();
      const createdData = await DataModel.findByPk(productModel.id, {
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      sendSuccessResponse(res, createdData, "Product model created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product model creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, {
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      if (!data) return sendNotFoundError(res, "Product model");

      sendSuccessResponse(res, data, "Product model retrieved successfully");
    } catch (error) {
      console.error("Product model show error:", error);
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

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product model");
      }

      const { code, title, base_price_changed } = req.body;

      if (code && code.trim() !== data.code) {
        const existingCode = await DataModel.findOne({
          where: { code: code.trim() },
          id: { [Op.ne]: id },
          paranoid: true,
        });
        if (existingCode) {
          await transaction.rollback();
          return sendErrorResponse(res, `Code "${code}" already exists`, { existing_id: existingCode.id }, 409);
        }
      }

      if (title && title.trim() !== data.title) {
        const newSlug = slugify(title.trim(), { lower: true, strict: true });

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

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      await data.update(req.body, { transaction });
      base_price_changed == 1 && (await updateVariantsPrices(transaction, id, req.body.base_price));
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id, {
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      sendSuccessResponse(res, updatedData, "Product model updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product model update error:", error);
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
      if (!data) return sendNotFoundError(res, "Product model");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Product model deleted successfully");
    } catch (error) {
      console.error("Product model deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getByProductId(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findAll({
        where: { product_id: id },
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      sendSuccessResponse(res, data, "Product models retrieved successfully");
    } catch (error) {
      console.error("Product models by product error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductModelsController;

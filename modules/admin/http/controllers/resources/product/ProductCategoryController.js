const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productCategoryRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");

const DataModel = models.ProductCategory;

class ProductCategoryController {
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

      sendSuccessResponse(res, response, "Product Categories retrieved successfully");
    } catch (error) {
      console.error("Product Categories index error:", error);
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

      if (!name || name.trim() === "") return sendErrorResponse(res, "Title is required to generate slug", null, 400);

      const newSlug = slugify(name.trim(), { lower: true, strict: true });

      const existing = await DataModel.findOne({
        where: { slug: newSlug },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, `Slug "${newSlug}" already exists`, { existing_id: existing.id }, 409);
      }

      req.body.slug = newSlug;

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const productCategory = await DataModel.create(req.body, { transaction });
      await transaction.commit();

      const createdData = await DataModel.findByPk(productCategory.id);

      sendSuccessResponse(res, createdData, "Product Categories created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product Categories creation error:", error);
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
            model: DataModel,
            as: "parent",
            attributes: ["id", "name", "slug", "media_path"],
          },
          {
            model: DataModel,
            as: "children",
            attributes: ["id", "name", "slug", "media_path", "status", "sort_order"],
            order: [["sort_order", "ASC"]],
          },
        ],
      });

      if (!data) return sendNotFoundError(res, "Product Categories");

      sendSuccessResponse(res, data, "Product Categories retrieved successfully");
    } catch (error) {
      console.error("Product Categories show error:", error);
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
      const { title } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Categories");
      }

      // ✅ Slug validation + prevent duplicates
      if (title && title.trim() !== data.title) {
        const newSlug = slugify(title.trim(), { lower: true, strict: true });

        // Check if slug exists for OTHER news
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
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);

      sendSuccessResponse(res, updatedData, "Product Categories updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Categories update error:", error);
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
      if (!data) return sendNotFoundError(res, "Product Categories");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Product Categories deleted successfully");
    } catch (error) {
      console.error("Product Categories deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getParentCategories(req, res) {
    try {
      const categories = await DataModel.findAll({
        where: { parent_id: null },
        attributes: ["id", "name", "slug", "media_path"],
        order: [
          ["sort_order", "ASC"],
          ["name", "ASC"],
        ],
      });

      sendSuccessResponse(res, categories, "Parent categories retrieved successfully");
    } catch (error) {
      console.error("Parent categories fetch error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductCategoryController;

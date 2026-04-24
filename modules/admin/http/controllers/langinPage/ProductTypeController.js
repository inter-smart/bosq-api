const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models/index.js");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../../traits/responseHandler.js");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../middleware/multerMiddleware.js");
const { paginate } = require("../../traits/datatablePaginationHelper.js");
const { validateId, validationRequestPost } = require("../../request/langinPage/productTypeRequest.js");
const { default: slugify } = require("slugify");
const { Op } = require("sequelize");

const DataModel = models.ProductTypes;
// const cacheKey = cacheKeys.ergonomichair;

class ProductTypeController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["title", "title_ar"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { title, landing_page_id } = req.body;

      const langinPage = await models.LandingPage.findByPk(landing_page_id);
      if (!langinPage) {
        await transaction.rollback();
        return sendErrorResponse(res, "Landing page not found");
      }

      let variantIds = [];

      if (req.body.product_variants) {
        variantIds = typeof req.body.product_variants === "string" ? JSON.parse(req.body.product_variants) : req.body.product_variants;

        // Ensure integers
        variantIds = variantIds.map(Number).filter(Boolean);
      }

      const slug = slugify(title.trim(), { lower: true, strict: true });
      req.body.slug = slug;

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      // Create data with transaction
      const data = await DataModel.create(
        {
          ...req.body,
          slug,
          product_variants: variantIds,
        },
        { transaction },
      );

      // await invalidateCache(cacheKey);

      // Commit the transaction
      await transaction.commit();
      sendSuccessResponse(res, data, "Data created successfully", 201);
    } catch (error) {
      console.error("Data creation error:", error);
      await transaction.rollback();
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    // Run ID validation
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) {
        return sendNotFoundError(res, "Data");
      }

      let productVariantsData = [];

      if (Array.isArray(data.product_variants) && data.product_variants.length > 0) {
        productVariantsData = await models.ProductVariants.findAll({
          where: {
            id: {
              [Op.in]: data.product_variants,
            },
          },
          attributes: ["id", "sku", "title"],
          include: [
            {
              model: models.ProductModels,
              as: "productModel",
              required: false,
              attributes: ["id", "title"],
              include: [
                {
                  model: models.ProductBase,
                  as: "product",
                  required: false,
                  attributes: ["id", "slug", "title"],
                },
              ],
            },
          ],
        });
      }

      const response = {
        ...data.toJSON(),
        product_variants_data: productVariantsData,
      };
      sendSuccessResponse(res, response, "Data retrieved successfully");
    } catch (error) {
      console.error("Data show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all([...validateId, ...validationRequestPost].map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const { title } = req.body;
      const slug = slugify(title.trim(), { lower: true, strict: true });
      req.body.slug = slug;

      let variantIds = [];

      if (req.body.product_variants) {
        variantIds = typeof req.body.product_variants === "string" ? JSON.parse(req.body.product_variants) : req.body.product_variants;

        // Ensure integers
        variantIds = variantIds.map(Number).filter(Boolean);
      }

      req.body.product_variants = variantIds;

      const data = await DataModel.findByPk(
        id,
        {
          // unique slug
          where: {
            slug: {
              [Op.ne]: req.body.slug,
            },
          },
        },
        transaction,
      );
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Data");
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      await data.update(req.body, { transaction });

      const updatedData = await DataModel.findByPk(data.id);
      await transaction.commit();

      return sendSuccessResponse(res, updatedData, "Data updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Data update error:", error);
      return sendErrorResponse(res, error);
    }
  }

  // Dropdown endpoints for product variant navigation
  static async getAllProductCategories(req, res) {
    try {
      const result = await models.ProductCategory.findAll({
        where: {
          status: true,
        },
        attributes: ["id", "name", "slug"],
      });
      return sendSuccessResponse(res, result, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getVariantsByCategory(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return sendErrorResponse(res, "Category id is required");
      }
      const result = await models.ProductVariants.findAll({
        attributes: ["id", "sku", "title"],
        include: [
          {
            model: models.ProductVariantCategories,
            as: "variantCategories",
            required: true,
            attributes: [],
            where: { category_id: id },
          },
        ],
      });
      return sendSuccessResponse(res, result, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroy(req, res) {
    // Run ID validation
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) {
        return sendNotFoundError(res, "Data");
      }

      // Soft delete
      await data.destroy();

      sendSuccessResponse(res, { id }, "Data deleted successfully");
    } catch (error) {
      console.error("Data deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductTypeController;

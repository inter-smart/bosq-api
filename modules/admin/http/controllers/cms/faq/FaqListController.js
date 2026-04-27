const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../../database/models");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../../traits/responseHandler");
const {
  validationRequestPost,
  validateId,
} = require("../../../request/cms/faq/faqListRequest");
const {
  paginate,
} = require("../../../../http/traits/datatablePaginationHelper");

const DataModel = models.FaqList;
const FaqCategoryModel = models.FaqCategory;
const cacheKeys = require("../../../../../redis/cacheKeys");
const { invalidateCache } = require("../../../../../redis/redisService");

const cacheKey = cacheKeys.faq;

class FaqListController {
  static async index(req, res) {
    try {
      const whereClause = {};
      const { product_variant, type, faq_category, base_id, model_id } =
        req.query;
      // Build where clause for filtering
      if (faq_category) {
        whereClause.faq_category_id = parseInt(faq_category, 10);
      }

      if (product_variant) {
        whereClause.product_variant_id = parseInt(product_variant, 10);
      } else if (model_id) {
        // Filter by model: find all variant IDs under that model
        const { Op } = require("sequelize");
        const variantRows = await models.ProductVariants.findAll({
          where: { product_model_id: parseInt(model_id, 10) },
          attributes: ["id"],
          raw: true,
        });
        const variantIds = variantRows.map((v) => v.id);
        whereClause.product_variant_id = variantIds.length
          ? { [Op.in]: variantIds }
          : { [Op.in]: [-1] }; // no results if no variants
        whereClause.type = "product";
      } else if (base_id) {
        // Filter by base product: resolve base → models → variants
        const { Op } = require("sequelize");
        const modelRows = await models.ProductModels.findAll({
          where: { product_id: parseInt(base_id, 10) },
          attributes: ["id"],
          raw: true,
        });
        const modelIds = modelRows.map((m) => m.id);
        let variantIds = [];
        if (modelIds.length) {
          const variantRows = await models.ProductVariants.findAll({
            where: { product_model_id: { [Op.in]: modelIds } },
            attributes: ["id"],
            raw: true,
          });
          variantIds = variantRows.map((v) => v.id);
        }
        whereClause.product_variant_id = variantIds.length
          ? { [Op.in]: variantIds }
          : { [Op.in]: [-1] };
        whereClause.type = "product";
      }

      if (type && !model_id && !base_id) {
        whereClause.type = type;
      }

      const result = await paginate(DataModel, req, {
        where: whereClause,
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["question", "answer"],
        include: [
          {
            model: FaqCategoryModel,
            as: "faq_category",
            attributes: ["id", "title", "status"],
          },
          {
            association: "product_variant",
            attributes: ["id", "title", "title_ar", "sku"],
          },
        ],
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
    await Promise.all(
      validationRequestPost.map((validation) => validation.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { type, faq_category_id, product_variant_id, ...rest } = req.body;

      // Verify category exists
      if (faq_category_id) {
        const categoryExists = await FaqCategoryModel.findByPk(faq_category_id);
        if (!categoryExists) {
          await transaction.rollback();
          return sendNotFoundError(res, "Category");
        }
      }

      if (type === "general" && !faq_category_id) {
        return res.status(422).json({
          success: false,
          message: "FAQ category is required for general FAQs",
        });
      }

      if (type === "product" && !product_variant_id) {
        return res.status(422).json({
          success: false,
          message: "Product variant is required for product FAQs",
        });
      }

      if (type === "general" && product_variant_id) {
        return res.status(422).json({
          success: false,
          message: "Product variant is not allowed for general FAQs",
        });
      }

      // Create data with transaction
      const data = await DataModel.create(
        {
          ...rest,
          type,
          faq_category_id: type === "general" ? faq_category_id : null,
          product_variant_id: type === "product" ? product_variant_id : null,
        },
        { transaction },
      );

      await invalidateCache(cacheKey);
      // Commit the transaction
      await transaction.commit();

      // Fetch with association
      const createdData = await DataModel.findByPk(data.id, {
        include: [
          {
            model: FaqCategoryModel,
            as: "faq_category",
            attributes: ["id", "title", "status"],
          },
        ],
      });

      sendSuccessResponse(res, createdData, "Data created successfully", 201);
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

      const data = await DataModel.findByPk(id, {
        include: [
          {
            model: FaqCategoryModel,
            as: "faq_category",
            attributes: ["id", "title", "status"],
          },
          {
            association: "product_variant",
            attributes: ["id", "title", "title_ar", "sku", "product_model_id"],
            include: [
              {
                association: "productModel",
                attributes: ["id", "product_id"],
              },
              {
                association: "categories",
                attributes: ["id"],
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!data) {
        return sendNotFoundError(res, "Data");
      }

      sendSuccessResponse(res, data, "Data retrieved successfully");
    } catch (error) {
      console.error("Data show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all(
      [...validateId, ...validationRequestPost].map((v) => v.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Data");
      }

      const { type, faq_category_id, product_variant_id, ...rest } = req.body;

      if (type === "general" && !faq_category_id) {
        return res.status(422).json({
          success: false,
          message: "FAQ category is required for general FAQs",
        });
      }

      if (type === "product" && !product_variant_id) {
        return res.status(422).json({
          success: false,
          message: "Product variant is required for product FAQs",
        });
      }

      if (type === "general" && product_variant_id) {
        return res.status(422).json({
          success: false,
          message: "Product variant not allowed for general FAQs",
        });
      }

      await data.update(
        {
          ...rest,
          type,
          faq_category_id: type === "general" ? faq_category_id : null,
          product_variant_id: type === "product" ? product_variant_id : null,
        },
        { transaction },
      );
      await invalidateCache(cacheKey);
      await transaction.commit();

      const updatedData = await DataModel.findByPk(data.id, {
        include: [
          {
            model: FaqCategoryModel,
            as: "faq_category",
            attributes: ["id", "title", "status"],
          },
        ],
      });

      return sendSuccessResponse(res, updatedData, "Data updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Data update error:", error);
      return sendErrorResponse(res, error);
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
      await invalidateCache(cacheKey);
      sendSuccessResponse(res, { id }, "Data deleted successfully");
    } catch (error) {
      console.error("Data deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getFaqDropDown(req, res) {
    try {
      const [products, category] = await Promise.all([
        models.ProductBase.findAll({
          where: { status: true },
          attributes: ["id", "title"],
          order: [["title", "ASC"]],
        }),
        models.FaqCategory.findAll({
          where: { status: true },
          attributes: ["id", "title"],
          order: [["title", "ASC"]],
        }),
      ]);

      sendSuccessResponse(
        res,
        { products, categories: category },
        "Dropdown data retrieved successfully",
      );
    } catch (error) {
      console.error("FAQ dropdown retrieval error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getFaqModelsDropdown(req, res) {
    try {
      const { base_id } = req.query;
      if (!base_id) {
        return res
          .status(422)
          .json({ success: false, message: "base_id is required" });
      }

      const productModels = await models.ProductModels.findAll({
        where: { product_id: parseInt(base_id, 10), status: true },
        attributes: ["id", "title", "title_ar", "slug"],
        order: [["title", "ASC"]],
      });

      sendSuccessResponse(
        res,
        { models: productModels },
        "Models retrieved successfully",
      );
    } catch (error) {
      console.error("FAQ models dropdown error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getFaqCategoriesDropdown(req, res) {
    try {
      const { model_id } = req.query;
      if (!model_id) {
        return res
          .status(422)
          .json({ success: false, message: "model_id is required" });
      }

      const variantIds = await models.ProductVariants.findAll({
        where: { product_model_id: parseInt(model_id, 10), status: true },
        attributes: ["id"],
        raw: true,
      });

      const ids = variantIds.map((v) => v.id);
      if (ids.length === 0) {
        return sendSuccessResponse(
          res,
          { categories: [] },
          "No variants found",
        );
      }

      const { Op } = require("sequelize");

      const junctionRows = await models.ProductVariantCategories.findAll({
        where: { product_variant_id: { [Op.in]: ids } },
        attributes: ["category_id"],
        group: ["category_id"],
        raw: true,
      });

      const categoryIds = junctionRows.map((r) => r.category_id);

      const categories = categoryIds.length
        ? await models.ProductCategory.findAll({
            where: { id: { [Op.in]: categoryIds }, status: true },
            attributes: ["id", "name", "name_ar", "slug"],  
            order: [["name", "ASC"]],
          })
        : [];

      sendSuccessResponse(
        res,
        { categories },
        "Categories retrieved successfully",
      );
    } catch (error) {
      console.error("FAQ categories dropdown error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getFaqVariantsDropdown(req, res) {
    try {
      const { model_id, category_id } = req.query;
      if (!model_id) {
        return res
          .status(422)
          .json({ success: false, message: "model_id is required" });
      }

      const whereClause = {
        product_model_id: parseInt(model_id, 10),
        status: true,
      };

      if (category_id) {
        const { Op, literal } = require("sequelize");
        whereClause[Op.and] = [
          literal(`EXISTS (
            SELECT 1 FROM "product_variant_categories" pvc
            WHERE pvc."product_variant_id" = "ProductVariants"."id"
              AND pvc."category_id" = ${parseInt(category_id, 10)}
          )`),
        ];
      }

      const variants = await models.ProductVariants.findAll({
        where: whereClause,
        attributes: [
          "id",
          "title",
          "title_ar",
          "sku",
          "design_title",
          "design_title_ar",
        ],
        order: [
          ["sort_order", "ASC"],
          ["id", "ASC"],
        ],
      });

      sendSuccessResponse(res, { variants }, "Variants retrieved successfully");
    } catch (error) {
      console.error("FAQ variants dropdown error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = FaqListController;

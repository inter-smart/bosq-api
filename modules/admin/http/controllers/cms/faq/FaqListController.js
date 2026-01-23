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
      const { product, type, faq_category } = req.query;
      // Build where clause for filtering
      if (faq_category) {
        whereClause.faq_category_id = parseInt(faq_category, 10);
      }


      if(product){
        whereClause.product_id = parseInt(product, 10);
      }

      if (type) {
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
            association: "product", attributes: ["id", "title"]
          }
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
      const { type, faq_category_id, product_id, ...rest } = req.body;

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

      if (type === "product" && !product_id) {
        return res.status(422).json({
          success: false,
          message: "Product is required for product FAQs",
        });
      }

      if (type === "general" && product_id) {
        return res.status(422).json({
          success: false,
          message: "Product is not allowed for general FAQs",
        });
      }


      // Create data with transaction
      const data = await DataModel.create(
        {
          ...rest,
          type,
          faq_category_id: type === "general" ? faq_category_id : null,
          product_id: type === "product" ? product_id : null,
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

      const { type, faq_category_id, product_id, ...rest } = req.body;

      // 🔐 SAME RULES APPLY
      if (type === "general" && !faq_category_id) {
        return res.status(422).json({
          success: false,
          message: "FAQ category is required for general FAQs",
        });
      }

      if (type === "product" && !product_id) {
        return res.status(422).json({
          success: false,
          message: "Product is required for product FAQs",
        });
      }

      if (type === "general" && product_id) {
        return res.status(422).json({
          success: false,
          message: "Product not allowed for general FAQs",
        });
      }

      const faq = await models.FaqList.findByPk(id);

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: "FAQ not found",
        });
      }

      // Verify category exists if category is being updated
      if (req.body.category) {
        const categoryExists = await FaqCategoryModel.findByPk(
          req.body.category,
        );
        if (!categoryExists) {
          await transaction.rollback();
          return sendNotFoundError(res, "Category");
        }
      }

      await data.update(
        {
          ...rest,
          type,
          faq_category_id: type === "general" ? faq_category_id : null,
          product_id: type === "product" ? product_id : null,
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

  static async getFaqDropDown(req,res){
    try {

      const [products, category] = await Promise.all([
        await models.ProductBase.findAll({
          where: { status: true },
          attributes: ['id', 'title'],
          order: [['title', 'ASC']],
        }),
        await models.FaqCategory.findAll({
          where: { status: true },
          attributes: ['id', 'title'],
          order: [['title', 'ASC']],
        })
      ])

      const result = {
        products: products,
        categories: category
      }

      sendSuccessResponse(res, result, "Product list retrieved successfully");
    }
    catch (error) {
      console.error("Product list retrieval error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = FaqListController;

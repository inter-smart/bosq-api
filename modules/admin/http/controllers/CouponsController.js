const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../database/models/index.js");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../traits/responseHandler.js");

const { Op, where, fn, col } = require("sequelize");

const { validationRequestPost, validateId } = require("../request/CouponsRequest.js");
const { paginate } = require("../traits/datatablePaginationHelper.js");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../middleware/multerMiddleware.js");

const DataModel = models.Coupons;

class CouponsController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [["createdAt", "DESC"]],
        searchFields: ["discount_type", "scope_type"],
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

  static async show(req, res) {
    // Run ID validation
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id, scope_type } = req.params;
      let data;
      const scope = await DataModel.findByPk(id, {
        attributes: ["scope_type"],
      });

      if (scope?.scope_type === "variant") {
        data = await DataModel.findByPk(id, {
          include: [
            {
              // variants
              model: models.ProductVariants,
              as: "variant",
              required: false,
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
                      include: [
                        {
                          model: models.ProductCategory,
                          as: "category",
                          required: false,
                          attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                          include: [
                            {
                              model: models.ProductCategory,
                              as: "parent",
                              required: false,
                              attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                            },
                            {
                              model: models.ProductCategory,
                              as: "children",
                              required: false,
                              attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      } else if (scope?.scope_type === "model") {
        data = await DataModel.findByPk(id, {
          include: [
            {
              model: models.ProductModels,
              as: "model",
              required: false,
              attributes: ["id", "title"],
              include: [
                {
                  model: models.ProductBase,
                  as: "product",
                  required: false,
                  attributes: ["id", "slug", "title"],
                  include: [
                    {
                      model: models.ProductCategory,
                      as: "category",
                      required: false,
                      attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                      include: [
                        {
                          model: models.ProductCategory,
                          as: "parent",
                          required: false,
                          attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                        },
                        {
                          model: models.ProductCategory,
                          as: "children",
                          required: false,
                          attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      } else if (scope?.scope_type === "product") {
        data = await DataModel.findByPk(id, {
          include: [
            {
              model: models.ProductBase,
              as: "product",
              required: false,
              attributes: ["id", "slug", "title"],
              include: [
                {
                  model: models.ProductCategory,
                  as: "category",
                  required: false,
                  attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                  include: [
                    {
                      model: models.ProductCategory,
                      as: "parent",
                      required: false,
                      attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                    },
                    {
                      model: models.ProductCategory,
                      as: "children",
                      required: false,
                      attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                    },
                  ],
                },
              ],
            },
          ],
        });
      } else if (scope?.scope_type === "category") {
        data = await DataModel.findByPk(id, {
          include: [
            {
              model: models.ProductCategory,
              as: "category",
              required: false,
              attributes: ["id", "slug", "name", "name_ar", "parent_id"],
              include: [
                {
                  model: models.ProductCategory,
                  as: "parent",
                  required: false,
                  attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                },
                {
                  model: models.ProductCategory,
                  as: "children",
                  required: false,
                  attributes: ["id", "slug", "name", "name_ar", "parent_id"],
                },
              ],
            },
          ],
        });
      } else if (scope?.scope_type === "common") {
        data = await DataModel.findByPk(id);
      }

      if (!data) {
        return sendNotFoundError(res, "Product");
      }

      sendSuccessResponse(res, data, "Data retrieved successfully");
    } catch (error) {
      console.error("Data show error:", error);
      sendErrorResponse(res, error);
    }
  }

  //   CREATE
  static async store(req, res) {
    await Promise.all(validationRequestPost.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();
    try {
      const { scope_type, scope_id } = req.body;

      if (scope_type === "category") {
        const category = await models.ProductCategory.findByPk(scope_id, {
          transaction,
        });
        if (!category) {
          await transaction.rollback();
          return sendNotFoundError(res, "Category");
        }
      } else if (scope_type === "product") {
        const product = await models.ProductBase.findByPk(scope_id, {
          transaction,
        });
        if (!product) {
          await transaction.rollback();
          return sendNotFoundError(res, "Product");
        }
      } else if (scope_type === "variant") {
        const variant = await models.ProductVariants.findByPk(scope_id, {
          transaction,
        });
        if (!variant) {
          await transaction.rollback();
          return sendNotFoundError(res, "Variant");
        }
      }

      const existingCode = await DataModel.findOne(
        {
          where: {
            code: {
              [Op.iLike]: req.body.code,
            },
          },
        },
        transaction,
      );

      if (existingCode) {
        await transaction.rollback();
        return sendErrorResponse(res, "Coupon already exists", null, 409);
      }

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const data = await DataModel.create(req.body, {
        transaction,
      });

      await transaction.commit();
      sendSuccessResponse(res, data, "Data created successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Data creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    // Run ID validation
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      //  update
      const { id } = req.params;
      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Data");
      }

      //  Avoid duplicate entry based on title
      const existingData = await DataModel.findOne({
        where: {
          code: req.body.code,
          id: { [Op.ne]: id },
        },
        transaction,
      });

      if (existingData) {
        await transaction.rollback();
        return sendErrorResponse(res, `${req.body.code} exists`);
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      await data.update(req.body, { transaction });

      await transaction.commit();
      const updatedData = await DataModel.findByPk(data.id);
      return sendSuccessResponse(res, updatedData, "Data updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Data deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getAllProductCategories(req, res) {
    try {
      const result = await models.ProductCategory.findAll({
        where: {
          status: true,
          parent_id: null,
        },
        attributes: ["id", "name", "slug"],

        include: [
          {
            model: models.ProductCategory,
            as: "children",
            attributes: ["id", "name", "slug"],
          },
        ],
      });
      return sendSuccessResponse(res, result, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getAllProducts(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return sendErrorResponse(res, "Category id is required");
      }

      const result = await models.ProductBase.findAll({
        where: {
          status: true,
          category_id: id,
        },
        attributes: ["id", "title", "slug"],
      });

      return sendSuccessResponse(res, result, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // get all product model
  static async getAllProductModels(req, res) {
    try {
      const result = await models.ProductModels.findAll({
        where: {
          status: true,
          product_id: req.params.id,
        },
        attributes: ["id", "title", "slug"],
      });
      return sendSuccessResponse(res, result, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // get product variants
  static async getAllProductVariants(req, res) {
    try {
      const { id } = req.params;
      const result = await models.ProductVariants.findAll({
        where: { product_model_id: id },
        attributes: ["id", "sku"],
      });
      return sendSuccessResponse(res, result, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = CouponsController;

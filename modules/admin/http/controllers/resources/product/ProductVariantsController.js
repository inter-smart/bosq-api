const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productVariantsRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");
const { createOrUpdateVariantAttributes } = require("../../../traits/ProductVariantHelper");

const DataModel = models.ProductVariants;

class ProductVariantsController {
  static async index(req, res) {
    try {
      const { product_id, product_model_id, category_id } = req.query;

      const whereClause = {
        deletedAt: {
          [Op.eq]: null,
        },
      };
      if (product_model_id) {
        whereClause.product_model_id = product_model_id;
      }

      if (product_id) {
        // Filter by base product ID via the productModel association
        whereClause["$productModel.product_id$"] = product_id;
      }

      if (category_id) {
        whereClause[Op.and] = sequelize.literal(`EXISTS (
          SELECT 1 FROM "product_variant_categories" pvc
          WHERE pvc."product_variant_id" = "ProductVariants"."id"
            AND pvc."category_id" = ${parseInt(category_id, 10)}
        )`);
      }

      const result = await paginate(DataModel, req, {
        where: whereClause,
        paranoid: false,
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["sku", "product_code", "title"],
        include: [
          {
            association: "productModel",
            attributes: ["id", "title", "product_id"],
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title"],
              },
            ],
          },
          {
            association: "categories",
            attributes: ["id", "name", "name_ar", "slug", "parent_id"],
            through: { attributes: [] },
          },
        ],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product Variants retrieved successfully");
    } catch (error) {
      console.error("Product Variants index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { product_model_id, variant_attributes: attributes, product_code = null, category_ids } = req.body;

      const product = await models.ProductModels.findByPk(product_model_id);
      if (!product) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product");
      }

      const pairs = attributes.map((a) => ({
        attribute_id: a.attribute_id,
        id: a.attribute_value_id,
      }));

      const validValues = await models.AttributeValues.findAll({
        where: {
          [Op.or]: pairs,
        },
        include: [
          {
            model: models.ProductAttribute,
            as: "attribute",
            required: true,
            attributes: [],
          },
        ],
        attributes: ["id", "attribute_id"],
      });

      if (validValues.length !== attributes.length) {
        await transaction.rollback();
        return sendNotFoundError(res, "Invalid attribute or attribute value detected");
      }

      const variant = await createOrUpdateVariantAttributes(transaction, attributes, product_model_id, "create", null, {});

      // Associate categories if provided
      if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
        const createdVariant = await DataModel.findOne({
          where: { product_model_id },
          order: [["createdAt", "DESC"]],
          transaction,
        });
        if (createdVariant) {
          await createdVariant.setCategories(category_ids, { transaction });
        }
      }

      await transaction.commit();

      sendSuccessResponse(res, null, "Product Variant created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product Variant creation error:", error);
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
        attributes: [
          "id",
          "status",
          "product_model_id",
          "sku",
          "product_code",
          "price",
          "status",
          "stock",
          "title",
          "title_ar",
          "media_path",
          "design_title",
          "design_title_ar",
          "hover_media_path",
          "is_featured",
          "brochure",
          "description",
          "description_ar",
          "details",
          "details_ar",
          "details_points",
          "details_points_ar",
          "additional_details",
          "additional_details_ar",
          "enhance_title",
          "enhance_title_ar",
          "sort_order",
        ],
        include: [
          {
            model: models.ProductVariantAttributes,
            as: "variant_attributes",
            attributes: ["id", "attribute_id", "attribute_value_id", "price"],
          },
          {
            association: "categories",
            attributes: ["id", "name", "name_ar", "slug", "parent_id"],
            through: { attributes: [] },
          },
        ],
      });

      if (!data) return sendNotFoundError(res, "Product Variant");

      sendSuccessResponse(res, data, "Product Variant retrieved successfully");
    } catch (error) {
      console.error("Product Variant show error:", error);
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
      const { product_model_id, attributes, category_ids } = req.body;

      const existingVariant = await DataModel.findByPk(id, { transaction });
      if (!existingVariant) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Variant");
      }

      const fileFields = ["media_path", "hover_media_path", "brochure"];
      await handleFileUploadUpdate(req, existingVariant, fileFields);

      const meta = req.body;

      await createOrUpdateVariantAttributes(transaction, attributes, product_model_id, "update", id, meta);

      // Update categories if provided
      if (category_ids !== undefined) {
        const variant = await DataModel.findByPk(id, { transaction });
        if (variant) {
          const ids = Array.isArray(category_ids) ? category_ids.map(Number) : [];
          await variant.setCategories(ids, { transaction });
        }
      }

      await transaction.commit();

      sendSuccessResponse(res, null, "Product Variant updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Variant update error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroyAll(req, res) {
    try {
      const { ids } = req.body;
      const { delete_type } = req.query;
      const isForceDelete = delete_type === "force";

      if (!Array.isArray(ids) || ids.length === 0) {
        return sendValidationError(res, [{ msg: "IDs must be a non-empty array" }]);
      }

      await DataModel.destroy({
        where: { id: ids },
        force: isForceDelete,
      });

      sendSuccessResponse(res, { deleted_ids: ids }, "Product Variants deleted successfully");
    } catch (error) {
      console.error("Product Variant bulk deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;
      const { delete_type } = req.query;
      const forceDelete = delete_type === "force";

      const data = await DataModel.findByPk(id);
      if (!data) return sendNotFoundError(res, "Product Variant");

      await data.destroy({ force: forceDelete });
      sendSuccessResponse(res, { id }, "Product Variant deleted successfully");
    } catch (error) {
      console.error("Product Variant deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async addProductVariant(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { product_id, attributes } = req.body;

      // Verify product exists
      const product = await models.ProductBase.findByPk(product_id);
      if (!product) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product");
      }

      const base_price = product.price || 0;

      // Check for duplicate SKU
      if (sku) {
        const existingSku = await DataModel.findOne({
          where: { sku },
          paranoid: false,
        });
        if (existingSku) {
          await transaction.rollback();
          return sendErrorResponse(res, `SKU "${sku}" already exists`, { existing_id: existingSku.id }, 409);
        }
      }

      // Check for duplicate product code
      if (product_code) {
        const existingCode = await DataModel.findOne({
          where: { product_code },
          paranoid: false,
        });
        if (existingCode) {
          await transaction.rollback();
          return sendErrorResponse(res, `Product code "${product_code}" already exists`, { existing_id: existingCode.id }, 409);
        }
      }

      const variant = await DataModel.create(req.body, { transaction });
      await transaction.commit();

      const createdData = await DataModel.findByPk(variant.id, {
        include: [
          {
            model: models.ProductBase,
            as: "product",
            attributes: ["id", "name", "name_ar", "slug"],
          },
        ],
      });

      sendSuccessResponse(res, createdData, "Product Variant created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product Variant creation error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductVariantsController;

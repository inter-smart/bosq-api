const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productVariantsRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { createProductVariants } = require("../../../traits/ProductVariantHelper");

const DataModel = models.ProductVariants;

class ProductVariantsController {
  static async index(req, res) {
    try {
      const { product_id } = req.query;

      const whereClause = {};
      if (product_id) {
        whereClause.product_id = product_id;
      }

      const result = await paginate(DataModel, req, {
        where: whereClause,
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["sku", "product_code"],
        include: [
          {
            model: models.ProductBase,
            as: "product",
            attributes: ["id", "title", "title_ar", "slug"],
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
      const { product_id, attributes, product_code = null } = req.body;

      const product = await models.ProductBase.findByPk(product_id);
      if (!product) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product");
      }

      const baseSku = product?.slug;
      const basePrice = Number(product?.base_price || 0);

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

      // Create variantCombinations
      const variantCombinations = createProductVariants(attributes, baseSku);

      if (variantCombinations.length === 0) {
        await transaction.rollback();
        return sendErrorResponse(res, "No valid product variants could be created from the provided attributes.");
      }

      for (const variantData of variantCombinations) {
        const createdVariant = await models?.ProductVariants.create(
          {
            product_id: product_id,
            sku: variantData?.sku,
            product_code: null,
            price: basePrice + variantData?.additional_price,
            stock: 0,
            status: true,
          },
          { transaction },
        );

        for (const attr of variantData.attributes) {
          await models?.ProductVariantAttributes.create(
            {
              product_variant_id: createdVariant.id,
              attribute_id: attr.attribute_id,
              attribute_value_id: attr.attribute_value_id,
              price: attr.price,
            },
            { transaction },
          );
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
        include: [
          {
            model: models.ProductAttribute,
            as: "attributes",
            through: { attributes: [] },
          },
          {
            model: models.AttributeValues,
            as: "attribute_values",
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
      const { product_id, sku, product_code } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Variant");
      }

      // Verify product exists if changing
      if (product_id && product_id !== data.product_id) {
        const product = await models.ProductBase.findByPk(product_id);
        if (!product) {
          await transaction.rollback();
          return sendNotFoundError(res, "Product");
        }
      }

      // Check for duplicate SKU (excluding current record)
      if (sku && sku !== data.sku) {
        const existingSku = await DataModel.findOne({
          where: {
            sku,
            id: { [Op.ne]: id },
          },
          paranoid: false,
        });
        if (existingSku) {
          await transaction.rollback();
          return sendErrorResponse(res, `SKU "${sku}" already exists`, { existing_id: existingSku.id }, 409);
        }
      }

      // Check for duplicate product code (excluding current record)
      if (product_code && product_code !== data.product_code) {
        const existingCode = await DataModel.findOne({
          where: {
            product_code,
            id: { [Op.ne]: id },
          },
          paranoid: false,
        });
        if (existingCode) {
          await transaction.rollback();
          return sendErrorResponse(res, `Product code "${product_code}" already exists`, { existing_id: existingCode.id }, 409);
        }
      }

      await data.update(req.body, { transaction });
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id, {
        include: [
          {
            model: models.ProductBase,
            as: "product",
            attributes: ["id", "name", "name_ar", "slug"],
          },
        ],
      });

      sendSuccessResponse(res, updatedData, "Product Variant updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Variant update error:", error);
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
      if (!data) return sendNotFoundError(res, "Product Variant");

      await data.destroy();
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

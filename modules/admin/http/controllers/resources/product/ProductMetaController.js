const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestUpdate, validateId } = require("../../../request/resources/ProductMetaRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");

const ProductVariants = models.ProductVariants;
const ProductMeta = models.ProductMeta;

const META_FIELDS = [
  "meta_title",
  "meta_title_ar",
  "meta_description",
  "meta_description_ar",
  "meta_keywords",
  "meta_keywords_ar",
  "other_meta",
  "other_meta_ar",
];

const buildResponseShape = (variant) => {
  const meta = variant.meta;

  return {
    id: variant.id,
    product_title: variant.title || null,
    product_slug: variant.sku || null,
    meta_title: meta?.meta_title ?? null,
    meta_title_ar: meta?.meta_title_ar ?? null,
    meta_description: meta?.meta_description ?? null,
    meta_description_ar: meta?.meta_description_ar ?? null,
    meta_keywords: meta?.meta_keywords ?? null,
    meta_keywords_ar: meta?.meta_keywords_ar ?? null,
    other_meta: meta?.other_meta ?? null,
    other_meta_ar: meta?.other_meta_ar ?? null,
  };
};

const includeOptions = [
  {
    model: ProductMeta,
    as: "meta",
  },
];

class ProductMetaController {
  static async index(req, res) {
    try {
      const result = await paginate(ProductVariants, req, {
        where: {},
        order: [["createdAt", "DESC"]],
        include: includeOptions,
        attributes: ["id", "sku", "title"],
        searchFields: ["title", "sku", "$meta.meta_title$", "$meta.meta_description$"],
        includeSubQuery: true,
      });

      const response = {
        list: result.data.map(buildResponseShape),
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product meta tags retrieved successfully");
    } catch (error) {
      console.error("Product meta index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const variant = await ProductVariants.findByPk(id, { attributes: ["id", "sku", "title"], include: includeOptions });
      if (!variant) return sendNotFoundError(res, "Product Variant");

      sendSuccessResponse(res, buildResponseShape(variant), "Product meta tags retrieved successfully");
    } catch (error) {
      console.error("Product meta show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all([...validateId, ...validationRequestUpdate].map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const variant = await ProductVariants.findByPk(id, {
        attributes: ["id", "sku", "title"],
        transaction,
      });

      if (!variant) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Variant");
      }

      const metaPayload = {};
      META_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) {
          metaPayload[field] = req.body[field];
        }
      });
      metaPayload.product_slug = variant.sku || null;

      const [meta] = await ProductMeta.findOrCreate({
        where: { product_variant_id: id },
        defaults: { product_variant_id: id, ...metaPayload },
        transaction,
      });

      await meta.update(metaPayload, { transaction });
      await transaction.commit();

      const updatedVariant = await ProductVariants.findByPk(id, { include: includeOptions });

      sendSuccessResponse(res, buildResponseShape(updatedVariant), "Product meta tags updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product meta update error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductMetaController;

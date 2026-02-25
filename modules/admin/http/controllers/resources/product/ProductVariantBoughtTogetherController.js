const { models, sequelize } = require("../../../../../../database/models");
const { sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../../../traits/responseHandler");

const DataModel = models.ProductVariants;

class ProductVariantBoughtTogetherController {
  // GET /resources/product-variant-bought-together/:variantId
  static async index(req, res) {
    try {
      const { variantId } = req.params;

      const variant = await DataModel.findByPk(variantId, {
        attributes: ["id", "sku", "title", "media_path", "price"],
        include: [
          {
            association: "productModel",
            attributes: ["id", "title"],
            include: [
              {
                model: models.ProductBase,
                as: "product",
                attributes: ["id", "title"],
              },
            ],
          },
          {
            association: "boughtTogetherVariants",
            attributes: ["id", "sku", "title", "media_path", "price", "product_model_id"],
            through: { attributes: [] },
            include: [
              {
                association: "productModel",
                attributes: ["id", "title"],
                include: [
                  {
                    model: models.ProductBase,
                    as: "product",
                    attributes: ["id", "title"],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!variant) return sendNotFoundError(res, "Product Variant");

      sendSuccessResponse(res, variant, "Bought together variants retrieved successfully");
    } catch (error) {
      console.error("BoughtTogether index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // POST /resources/product-variant-bought-together/:variantId/sync
  // Body: { related_variant_ids: number[] }
  static async sync(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { variantId } = req.params;
      const { related_variant_ids } = req.body;

      if (!variantId) {
        await transaction.rollback();
        return sendErrorResponse(res, new Error("variantId is required"));
      }

      if (!related_variant_ids) {
        await transaction.rollback();
        return sendErrorResponse(res, new Error("related_variant_ids is required"));
      }

      if (!Array.isArray(related_variant_ids)) {
        await transaction.rollback();
        return sendErrorResponse(res, new Error("related_variant_ids must be an array of numbers"));
      }

      const variant = await DataModel.findByPk(variantId);
      if (!variant) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Variant");
      }

      const ids = Array.isArray(related_variant_ids) ? related_variant_ids.map(Number).filter((id) => id !== Number(variantId)) : [];

      await variant.setBoughtTogetherVariants(ids, { transaction });

      await transaction.commit();

      sendSuccessResponse(res, null, "Bought together variants updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("BoughtTogether sync error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductVariantBoughtTogetherController;

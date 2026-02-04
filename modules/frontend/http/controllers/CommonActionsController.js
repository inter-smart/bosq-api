const { models } = require("../../../../database/models/index");
const { sendErrorResponse, sendSuccessResponse } = require("../../../admin/http/traits/responseHandler");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");

const cacheKey = cacheKeys.listingDropdownFilters;

class CommonActionsController {
  static async getLisitngFilters(req, res) {
    try {
      // 1️⃣ Return cached response early
      const cachedData = await getCache(cacheKey);
      // if (cachedData) {
      //   return sendSuccessResponse(res, cachedData, "Data fetched from cache");
      // }

      // 2️⃣ Fetch all data in parallel
      const [categories, sectors, attributes] = await Promise.all([
        models.ProductCategory.findAll({
          where: { status: true },
          attributes: ["id", "name", "name_ar", "parent_id", "media_path", "slug"],
          order: [["sort_order", "ASC"]],
          raw: true,
        }),

        models.ProductSectors.findAll({
          where: { status: true },
          attributes: ["id", "name", "name_ar", "media_path", "slug"],
          order: [["sort_order", "ASC"]],
          raw: true,
        }),

        models.ProductAttribute.findAll({
          where: { status: true },
          attributes: ["id", "name", "name_ar", "slug", "code"],
          include: [
            {
              model: models.AttributeValues,
              as: "values",
              where: { status: true },
              required: false, // don't drop attributes without values
              attributes: ["id", "attribute_id", "value", "value_ar", "media_path", "slug"],
            },
          ],
          order: [["sort_order", "ASC"]],
        }),
      ]);

      const response = { categories, sectors, attributes };

      // 3️⃣ Cache final response
      await setCache(cacheKey, response);

      sendSuccessResponse(res, response, "Data retrieved successfully");
    } catch (error) {
      console.error("Listing filters error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async productSearchCategories(req, res) {
    try {
      const categories = await models.ProductCategory.findAll({
        where: { status: true },
        attributes: ["id", "name", "name_ar", "parent_id", "slug"],
        order: [["sort_order", "ASC"]],
        raw: true,
        limit: 5,
      });

      const parentCategories = categories.filter((category) => !category.parent_id);
      const childCategories = categories.filter((category) => category.parent_id);

      sendSuccessResponse(res, { suggestions: parentCategories, categories: childCategories }, "Product search categories retrieved successfully");
    } catch (error) {
      console.error("Product search categories error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async chooseDesignFilters(req, res) {
    const { slug } = req.query;

    try {
      if (!slug) {
        return sendErrorResponse(res, { message: "Slug is required" }, 400);
      }

      const baseProduct = await models.ProductBase.findOne({
        where: { slug, status: true },
        attributes: ["id", "title", "title_ar", "slug"],
        include: [
          {
            model: models.ProductModels,
            as: "models",
            where: { status: true },
            required: false,
            attributes: ["id", "title", "title_ar", "slug", "code", "media_path"],
            include: [
              {
                model: models.ProductVariants,
                as: "variants",
                where: { status: true },
                required: false,
                attributes: ["id"],
                include: [
                  {
                    model: models.ProductVariantAttributes,
                    as: "variant_attributes",
                    attributes: ["id", "attribute_id", "attribute_value_id"],
                    include: [
                      {
                        model: models.ProductAttribute,
                        attributes: ["id", "name", "name_ar", "slug", "code"],
                      },
                      {
                        model: models.AttributeValues,
                        attributes: ["id", "value", "value_ar", "media_path", "slug"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        order: [
          [{ model: models.ProductModels, as: "models" }, "sort_order", "ASC"],
          [{ model: models.ProductModels, as: "models" }, { model: models.ProductVariants, as: "variants" }, "sort_order", "ASC"],
        ],
      });

      if (!baseProduct) {
        return sendErrorResponse(res, { message: "Product not found" }, 404);
      }

      // Transform models with their unique attributes
      const modelsWithAttributes =
        baseProduct.models?.map((model) => {
          const attributesMap = new Map();

          // Extract unique attributes with their values from this model's variants
          model.variants?.forEach((variant) => {
            variant.variant_attributes?.forEach((va) => {
              const attr = va.ProductAttribute;
              const attrValue = va.AttributeValue;

              if (attr && attrValue) {
                if (!attributesMap.has(attr.id)) {
                  attributesMap.set(attr.id, {
                    id: attr.id,
                    name: attr.name,
                    name_ar: attr.name_ar,
                    slug: attr.slug,
                    code: attr.code,
                    values: new Map(),
                  });
                }

                const attrEntry = attributesMap.get(attr.id);
                if (!attrEntry.values.has(attrValue.id)) {
                  attrEntry.values.set(attrValue.id, {
                    id: attrValue.id,
                    attribute_id: attr.id,
                    value: attrValue.value,
                    value_ar: attrValue.value_ar,
                    media_path: attrValue.media_path,
                    slug: attrValue.slug,
                  });
                }
              }
            });
          });

          // Convert maps to arrays
          const attributes = Array.from(attributesMap.values()).map((attr) => ({
            id: attr.id,
            name: attr.name,
            name_ar: attr.name_ar,
            slug: attr.slug,
            code: attr.code,
            values: Array.from(attr.values.values()),
          }));

          return {
            id: model.id,
            code: model.code,
            title: model.title,
            title_ar: model.title_ar,
            slug: model.slug,
            media_path: generateImageUrl(model.media_path),
            attributes,
          };
        }) || [];

      sendSuccessResponse(res, { models: modelsWithAttributes }, "Design filters retrieved successfully");
    } catch (error) {
      console.error("Choose design filters error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = CommonActionsController;

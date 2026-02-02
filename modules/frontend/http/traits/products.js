const { models } = require("../../../../database/models/index");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const { generateProductBasedata, buildAttributesFromVariants } = require("./dataManipulations/product/product");

const productAttributes = [
  "id",
  "title",
  "title_ar",
  "slug",
  "description",
  "description_ar",
  "details",
  "details_ar",
  "details_points",
  "details_points_ar",
  "additional_details",
  "additional_details_ar",
  "media_path",
  "category_id",
  "sort_order",
  "status",
];

class ProductServiceHelpers {
  static async getProductBaseData(slug) {
    const cacheKey = cacheKeys?.productBaseDetail(slug);
    const baseDataFromCache = await getCache(cacheKey);
    if (baseDataFromCache) {
      return {
        data: baseDataFromCache,
        fromCache: true,
      };
    }

    const productBaseData = await models.ProductBase.findOne({
      where: { slug: slug, status: true },
      attributes: productAttributes,
      include: [
        { association: "sellingPoints", attributes: ["id", "name", "slug", "media_path"], through: { attributes: [] } },
        { association: "category", attributes: ["id", "name", "name_ar", "parent_id", "slug"] },
        { association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"] },
        { association: "faqs", attributes: ["id", "question", "answer", "question_ar", "answer_ar"] },
      ],
    });

    const data = generateProductBasedata(productBaseData);
    await setCache(cacheKey, data);
    return {
      data,
      fromCache: false,
    };
  }

  static async getProductVariantRelatedModels(product_base_id) {
    const cacheKey = cacheKeys?.productVariantRelatedModels(product_base_id);
    const baseDataFromCache = await getCache(cacheKey);
    if (baseDataFromCache) {
      return {
        data: baseDataFromCache,
        fromCache: true,
      };
    }

    const productmodels = await models?.ProductModels?.findAll({
      where: { product_id: product_base_id, status: true },
      attributes: ["id", "code", "title", "title_ar", "slug", "media_path"],
      include: [
        {
          association: "variants",
          as: "allVariants",
          attributes: ["id", "sku"],
          required: false,
          include: [
            {
              association: "attribute_values",
              attributes: ["id"],
              through: { attributes: [] },
              include: [
                {
                  association: "attribute",
                  attributes: ["id", "name", "code", "slug"],
                  include: [
                    {
                      association: "values",
                      attributes: ["id", "attribute_id", "value", "slug"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const data =
      productmodels?.map((model) => ({
        id: model.id,
        code: model.code,
        title: model.title,
        title_ar: model.title_ar,
        slug: model.slug,
        media_path: generateImageUrl(model.media_path),
        attributes: buildAttributesFromVariants(model.variants || []),
      })) || [];
    await setCache(cacheKey, data);
    return {
      data,
      fromCache: false,
    };
  }
}

module.exports = ProductServiceHelpers;

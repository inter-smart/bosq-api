const { models } = require("../../../../../database/models/index");
const { transformProductData } = require("../../traits/dataManipulations/product/product");
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

class ProductsService {
  static async getProductBySlug(slug) {
    try {
      const productBase = await models.ProductBase.findOne({
        where: { slug, status: true },
        attributes: ["id"],
      });

      const productData = await models.ProductBase.findOne({
        where: { slug, status: true },
        attributes: productAttributes,
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug", "media_path"], through: { attributes: [] } },
          { association: "category", attributes: ["id", "name", "name_ar", "parent_id", "slug"] },
          {
            association: "models",
            attributes: ["id", "code", "title", "base_price", "slug", "media_path"],
            required: true,
            include: [
              {
                association: "variants",
                attributes: ["id", "sku"],
                required: true,
                include: [
                  { association: "variant_images", attributes: ["id", "media_path", "media_type", "is_primary", "sort_order"] },
                  {
                    association: "attribute_values",
                    attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
                    through: { attributes: [] },
                    include: [{ association: "attribute", attributes: ["id", "name", "name_ar", "code", "slug"] }],
                  },
                ],
              },
            ],
          },
          { association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"] },
          { association: "faqs", attributes: ["id", "question", "answer", "question_ar", "answer_ar"] },
        ],
        order: [
          [
            {
              model: models.ProductModels,
              as: "models",
            },
            "sort_order",
            "ASC",
          ],
        ],
      });

      const models = await models?.ProductModels?.findAll({
        where: { product_id: productBase.id, status: true },
        attributes: ["id", "code", "title", "title_ar", "slug", "media_path"],
      });

      const transformedData = transformProductData(productData);

      return {
        data: {
          productBaseData: transformedData?.data.productBaseData,
          modelData: transformedData?.data.modelWiseData,
        },

        fromCache: false,
        message: `Product data for ${slug} fetched`,
      };
    } catch (error) {
      console.error(`Error getting PRODUCT data for ${slug}:`, error);
      throw new Error(`Error fetching PRODUCT data for ${slug}: ${error.message}`);
    }
  }
  static async getProductModelData(slug) {
    try {
      const productModelData = await models.ProductModels.findOne({
        where: { slug, status: true },
        attributes: ["id", "code", "title", "slug", "media_path"],
        required: true,
        include: [
          {
            association: "variants",
            attributes: ["id", "sku"],
            required: true,
            include: [
              { association: "variant_images", attributes: ["id", "media_path", "media_type", "is_primary", "sort_order"] },
              {
                association: "attribute_values",
                attributes: ["id", "attribute_id", "value", "value_ar", "slug", "media_path"],
                through: { attributes: [] },
                include: [{ association: "attribute", attributes: ["id", "name", "name_ar", "code", "slug"] }],
              },
            ],
          },
        ],
      });
      return {
        data: productModelData ? productModelData : [],
        fromCache: false,
        message: "About page data fetched",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT MODEL data for ${slug}:`, error);
      throw new Error(`Error fetching PRODUCT MODEL data for ${slug}: ${error.message}`);
    }
  }
}

module.exports = ProductsService;

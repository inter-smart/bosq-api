const { models } = require("../../../../../database/models/index");
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
      const baseProduct = await models.ProductBase.findOne({
        where: { slug, status: true },
        attributes: productAttributes,
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          { association: "category", attributes: ["id", "name", "name_ar", "parent_id", "slug"] },
          { association: "models", attributes: ["id", "code", "title", "slug"] },
          { association: "sectors", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          { association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"] },
        ],
      });
      return {
        data: baseProduct,
        fromCache: false,
        message: "About page data fetched",
      };
    } catch (error) {
      console.error(`Error getting PRODUCT data for ${slug}:`, error);
      throw new Error(`Error fetching PRODUCT data for ${slug}: ${error.message}`);
    }
  }
}

module.exports = ProductsService;

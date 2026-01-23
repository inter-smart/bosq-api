const { models } = require("../../../../database/models/index");
const { sendErrorResponse, sendSuccessResponse } = require("../../../admin/http/traits/responseHandler");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");

const cacheKey = cacheKeys.listingDropdownFilters;

class CommonActionsController {
  static async getLisitngFilters(req, res) {
    try {
      // 1️⃣ Return cached response early
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        return sendSuccessResponse(res, cachedData, "Data fetched from cache");
      }

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
}

module.exports = CommonActionsController;

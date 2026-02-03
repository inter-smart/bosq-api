const { models } = require("../../../../database/models");
const {
  sendErrorResponse,
} = require("../../../admin/http/traits/responseHandler");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");

const cacheKey = cacheKeys.state;

class StateService {
  static async getData(req, res) {
    try {
      const { slug } = req.query;

      if (!slug) {
        return sendErrorResponse(res, null, "country_slug is required", 400);
      }

      const key = `${cacheKeys.state}:${slug}`;

      const cachedData = await getCache(key);
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "data fetched from cache",
        };
      }

      const data = await models.State.findAll({
        attributes: ["name", "slug"],
        include: [
          {
            model: models.Country,
            as: "country",
            attributes: [], // ❌ hide country data

            where: { slug },
          },
        ],
      });

      await setCache(key, data);

      return {
        data,
        message: "data fetched",
      };
    } catch (error) {
      console.error("Error getting data:", error);
      throw error;
    }
  }
}

module.exports = StateService;

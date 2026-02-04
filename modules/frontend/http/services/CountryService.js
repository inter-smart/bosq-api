const { Op } = require("sequelize");
const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");

const cacheKey = cacheKeys.country;

class CountryService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "data fetched from cache",
      //   };
      // }

      //   3. If no cached data, fetch from database
      const data = await models.Country.findAll({
        attributes: ["name", "slug"],
        where: {
          slug: {
            [Op.in]: ["ae", "om"],
          },
        },
      });

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, data);

      //   6. Return the result
      return {
        data: data,
        message: "data fetched",
      };
    } catch (error) {
      console.error("Error getting data:", error);
      throw new Error(`Error fetching data: ${error.message}`);
    }
  }
}

module.exports = CountryService;

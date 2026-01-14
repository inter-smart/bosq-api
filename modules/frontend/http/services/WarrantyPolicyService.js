const { where } = require("sequelize");
const { models } = require("../../../../database/models/index.js");
const cacheKeys = require("../../../redis/cacheKeys.js");
const { setCache, getCache } = require("../../../redis/redisService.js");
const { buildTitleSection, buildPolicyData} = require("../traits/dataManipulations/warrantyPolicy.js");

const cacheKey = cacheKeys.warrantyPolicy;

class WarrantyPolicyService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "Return Policy page data fetched from cache",
        };
      }

      //   3. If no cached data, fetch from database
      const warrantyPolicy = await models.WarrantyPolicy.findAll({
        where: {
          status: true
        },
        order: [["sort_order", "ASC"]]
      })

      if (!warrantyPolicy) {
        throw new Error("No Return policy CMS data found");
      }


      //   4. Process and structure the data
      const heroData = buildTitleSection(warrantyPolicy[0]|| []);
      const warrantyData = buildPolicyData(warrantyPolicy);
      const result = {
        heroData,
        warrantyData,
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "Return Policy page data fetched",
      };
    } catch (error) {
      console.error("Error getting Return POLICY PAGE data:", error);
      throw new Error(
        `Error fetching Return policy page data: ${error.message}`
      );
    }
  }
}

module.exports = WarrantyPolicyService;

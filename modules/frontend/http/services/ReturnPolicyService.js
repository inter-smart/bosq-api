const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { buildReturnData , buildTitleSection} = require("../traits/dataManipulations/returnPolicyCms");

const cacheKey = cacheKeys.returnPolicy;

class ReturnPolicyService {
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
      const [ReturnPolicyCms, policies] = await Promise.all([
        models.ReturnPolicyCms.findOne(),
        models.ReturnPolicies.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        
      ]);

      if (!ReturnPolicyCms) {
        throw new Error("No Return policy CMS data found");
      }

      if (!policies) {
        throw new Error("No policies found");
      }

      //   4. Process and structure the data
      const heroData = buildTitleSection(policies[0]|| []);
      const returnData = buildReturnData(ReturnPolicyCms, policies);
      const result = {
        heroData,
        returnData,
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

module.exports = ReturnPolicyService;

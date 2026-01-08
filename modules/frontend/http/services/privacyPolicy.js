const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const {
  buildPrivacyPolicyData,
} = require("../traits/dataManipulations/policyCms");

const cacheKey = cacheKeys.privacyPolicy;

class PrivacyPolicyService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "privacy Policy page data fetched from cache",
        };
      }

      //   3. If no cached data, fetch from database
      const [PrivacyPolicyCms, category] = await Promise.all([
        models.PrivacyPolicyCms.findOne(),
        models.Policies.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      if (!PrivacyPolicyCms) {
        throw new Error("No privacy policy CMS data found");
      }

      if (!category) {
        throw new Error("No policies found");
      }

      //   4. Process and structure the data
      const heroData = buildTitleSection(PrivacyPolicyCms);
      const privacyPolicyData = buildPrivacyPolicyData(category);
      const result = {
        heroData,
        privacyPolicyData,
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "privacy Policy page data fetched",
      };
    } catch (error) {
      console.error("Error getting privacy POLICY PAGE data:", error);
      throw new Error(
        `Error fetching privacy policy page data: ${error.message}`
      );
    }
  }
}

module.exports = PrivacyPolicyService;

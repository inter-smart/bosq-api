const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { buildData } = require("../traits/dataManipulations/authCms");

const cacheKey = cacheKeys.auth;

class AuthCmsService {
  static async getData() {
    try {
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "Auth Page data fetched from cache",
        };
      }

      const cmsData = await models.AuthCms.findOne();

      if (!cmsData) {
        throw new Error("No auth information found");
      }

      const authPageData = buildData(cmsData);

      const result = {
        authPageData,
      };

      await setCache(cacheKey, result);

      return {
        data: result,
        fromCache: false,
        message: "Auth Page data fetched",
      };
    } catch (error) {
      console.error("Error getting auth data:", error);
      throw new Error(`Error fetching auth data: ${error.message}`);
    }
  }
}

module.exports = AuthCmsService;

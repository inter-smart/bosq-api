const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const { buildData } = require("../traits/dataManipulations/ergonomicChair");

const cacheKey = cacheKeys.ergonomichair;

class ErgonomicChairService {
  static async getData() {
    try {
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "Ergonomic Chair page data fetched from cache",
        };
      }

      const [cmsData, sections] = await Promise.all([
        models.ErgonomicCms.findOne(),
        models.ErgonomicFeatures.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      if (!cmsData) {
        throw new Error("No ergonomic chair information found");
      }

      if (!sections) {
        throw new Error("No images found");
      }

      const heroData = buildTitleSection(cmsData);
      const ergonomicChairData = buildData(cmsData, sections);

      const result = {
        heroData,
        ergonomicChairData,
      };

      await setCache(cacheKey, result);

      return {
        data: result,
        fromCache: false,
        message: "Ergonomic Chair page data fetched",
      };
    } catch (error) {
      console.error("Error getting ergonomic chair data:", error);
      throw new Error(`Error fetching ergonomic chair data: ${error.message}`);
    }
  }
}

module.exports = ErgonomicChairService;

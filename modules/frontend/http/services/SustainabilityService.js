const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const { buildSustainabilityData } = require("../traits/dataManipulations/sustainability");

const cacheKey = cacheKeys.sustainability;

class SustainabilityService {
  static async getData() {
    try {
      const cachedData = await getCache(cacheKey);

      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "Sustainability page data fetched from cache",
      //   };
      // }

      const [sustainabilityInfo, sectionImages] = await Promise.all([
        models.SustainabilityCms.findOne(),
        models.TwoImage.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      if (!sustainabilityInfo) {
        throw new Error("No sustainability information found");
      }

      if (!sectionImages) {
        throw new Error("No images found");
      }

      const heroData = buildTitleSection(sustainabilityInfo);
      const sustainabilityData = buildSustainabilityData(sustainabilityInfo, sectionImages);

      const result = {
        heroData,
        sustainabilityData,
      };

      await setCache(cacheKey, result);

      return {
        data: result,
        fromCache: false,
        message: "Sustainability page data fetched",
      };
    } catch (error) {
      console.error("Error getting sustainability data:", error);
      throw new Error(`Error fetching sustainability data: ${error.message}`);
    }
  }
}

module.exports = SustainabilityService;

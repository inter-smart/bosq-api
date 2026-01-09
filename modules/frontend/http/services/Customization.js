const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { buildTitleSection, buildCmsSection, buildBannerSection } = require("../traits/dataManipulations/common");
const { buildFeaturesSection } = require("../traits/dataManipulations/customization");
const { buildDeliveryData, buildDeliveryInfo, buildProcessSection, buildOptionsSection } = require("../traits/dataManipulations/deliveryPolicy");

const cacheKey = cacheKeys.customization;

class CustomizationService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "Customization page data fetched from cache",
        };
      }

      //   3. If no cached data, fetch from database
      const [customizationCms, customizationFeatures, customizationProcess, customizationOptions] = await Promise.all([
        models.CustomizationCms.findOne(),
        models.CustomizationFeatures.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
          models.CustomizationProcess.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
           models.CustomizationOptions.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

    
      //   4. Process and structure the data
      const heroData = buildTitleSection(customizationCms);
      const customizationData = buildBannerSection(customizationCms, "banner");
      const FeaturesSection = buildFeaturesSection(customizationFeatures);
      const processSection = buildProcessSection(customizationCms, customizationProcess);
      const optionsSection = buildOptionsSection(customizationCms, customizationOptions);
      const requestCustomQuote = buildCmsSection(customizationCms, "form");

      const result = {
        heroData,
        customizationData,
        FeaturesSection,
        processSection,
        optionsSection,
        requestCustomQuote
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "Customization page data fetched",
      };
    } catch (error) {
      console.error("Error getting Customization PAGE data:", error);
      throw new Error(
        `Error fetching Customization page data: ${error.message}`
      );
    }
  }
}

module.exports = CustomizationService;

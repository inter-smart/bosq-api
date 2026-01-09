const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const { buildMaterialInfoSection } = require("../traits/dataManipulations/materialsGuide");

const cacheKey = cacheKeys.materialsGuide;

class MaterialGuideService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
    //   if (cachedData) {
    //     return {
    //       data: cachedData,
    //       fromCache: true,
    //       message: "Materials guide page data fetched from cache",
    //     };
    //   }

      //   3. If no cached data, fetch from database
      const [materialGuideCms, materials, materialCategories] = await Promise.all([
        models.MaterialGuideCms.findOne(),
        models.Materials.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
          models.MaterialCategories.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

    
      //   4. Process and structure the data
      const heroData = buildTitleSection(materialGuideCms);
      const materialsInfo = buildMaterialInfoSection(materialGuideCms, materials, materialCategories);
   
      const result = {
        heroData,
        materialsInfo
        
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "Materials guide page data fetched",
      };
    } catch (error) {
      console.error("Error getting Materials guide PAGE data:", error);
      throw new Error(
        `Error fetching Materials guide page data: ${error.message}`
      );
    }
  }
}

module.exports = MaterialGuideService;

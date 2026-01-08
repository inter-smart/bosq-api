const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations.js/common");
const { buildFaqData } = require("../traits/dataManipulations.js/termsAndConditions");

const cacheKey = cacheKeys.termsAndConditions;

class TermsAndConditionsService{
    static async getData(req, res) {
        try {
          // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
    //   if (cachedData) {
    //     return {
    //       data: cachedData,
    //       fromCache: true,
    //       message: "Terms and conditions page data fetched from cache",
    //     };
    //   }

      //   3. If no cached data, fetch from database
      const [termsAndConditions, faq] = await Promise.all([
        models.TermsAndConditions.findOne(),
        models.Faq.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      if (!termsAndConditions) {
        throw new Error("No Terms and conditions CMS data found");
      }

      if (!faq) {
        throw new Error("No faq found");
      }

      //   4. Process and structure the data
      const heroData = buildTitleSection(termsAndConditions);
      const termsFaqData = buildFaqData(termsAndConditions, faq);
      const result = {
        heroData,
        termsFaqData,
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "Terms and conditions page data fetched",
      };
          return sendSuccessResponse(res, data, message, 200);
        } catch (error) {
          return sendErrorResponse(res, error, "Internal Server Error", 500);
        }
      }
}


module.exports = TermsAndConditionsService
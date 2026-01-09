const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const { buildDeliveryData, buildDeliveryInfo } = require("../traits/dataManipulations/deliveryPolicy");

const cacheKey = cacheKeys.deliveryPolicy;

class DeliveryPolicyService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "Return Policy page data fetched from cache",
      //   };
      // }

      //   3. If no cached data, fetch from database
      const [deliveryCms, deliveryTime, deliveryMethods] = await Promise.all([
        models.DeliveryCms.findOne(),
        models.DeliveryTime.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
          models.DeliveryMethods.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      if (!deliveryCms) {
        throw new Error("No Return policy CMS data found");
      }

      if (!deliveryTime) {
        throw new Error("No policies found");
      }

      if (!deliveryMethods) {
        throw new Error("No delivery methods found");
      }

      //   4. Process and structure the data
      const heroData = buildTitleSection(deliveryCms);
      const deliveryData = buildDeliveryData(deliveryCms, deliveryMethods);
      const deliveryInfo = buildDeliveryInfo(deliveryCms, deliveryTime);
      const result = {
        heroData,
        deliveryData,
        deliveryInfo
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

module.exports = DeliveryPolicyService;

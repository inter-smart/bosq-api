const { Op } = require("sequelize");
const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { buildCouponSections } = require("../traits/dataManipulations/coupons");

class CouponsServices {
  static async getData() {
    try {
      const data = await models.Coupons.findAll({
        where: {
          status: true,
        },
      
      });

      const coupons = buildCouponSections(data);
      return {
        data:coupons,
        message: "data fetched",
      };
    } catch (error) {
      console.error("Error getting data:", error);
      throw new Error(`Error fetching data: ${error.message}`);
    }
  }
}

module.exports = CouponsServices;

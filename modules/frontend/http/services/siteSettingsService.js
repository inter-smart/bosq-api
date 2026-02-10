const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const {
  buildHeaderSection,
  buildFooterSection,
  buildFooterIcons,
  buildNavigationData,
} = require("../traits/dataManipulations/siteSettings");

const cacheKey = cacheKeys.siteSettings;

class SiteSettingsService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "Site settings data fetched from cache",
      //   };
      // }

      //   3. If no cached data, fetch from database
      const [siteSettings, socialLinks, paymentMethods, products, projects] =
        await Promise.all([
          await models.HeaderFooter.findOne(),
          await models.SocialMedia.findAll({
            where: {
              status: true,
            },
            order: [["sort_order", "ASC"]],
          }),
          await models.PaymentMethods.findAll({
            where: {
              status: true,
            },
            order: [["sort_order", "ASC"]],
          }),

          await models.ProductCategory.findAll({
            where: {
              status: true,
            },
            attributes: ["name", "name_ar", "media_path", "slug"],
            include: [
              {
                model: models.ProductCategory,
                as: "children",
                required: true, // INNER JOIN
                attributes: ["name", "name_ar", "media_path", "slug"],
                where: { status: true },
              },
            ],
            order: [["sort_order", "ASC"]],
          }),
          await models.Projects.findAll({
            where: {
              status: true,
            },
            attributes: ["title", "title_ar", "thumbnail", "slug"],
            order: [["sort_order", "ASC"]],
          }),
        ]);

      const headerData = buildHeaderSection(siteSettings);
      const footerData = buildFooterSection(siteSettings);
      const socialMedia = buildFooterIcons(socialLinks);
      const cards = buildFooterIcons(paymentMethods);
      const navigationData = buildNavigationData(products, projects);

      const result = {
        headerData,
        footerData,
        socialMedia,
        cards,
        products,
        projects,
        navigationData,
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "Site settings data fetched",
      };
    } catch (error) {
      console.error("Error getting Site settings data:", error);
      throw new Error(`Error fetching Site settings data: ${error.message}`);
    }
  }
}

module.exports = SiteSettingsService;

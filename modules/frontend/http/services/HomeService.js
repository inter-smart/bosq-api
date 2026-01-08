const { redisClient } = require("../../../../config/redis");
const { models } = require("../../../../database/models");

const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const {
  buildCmsSection,
  buildTitleSection,
} = require("../traits/dataManipulations/common");
const {
  buildHomeBannerSliders,
  buildProjectsSection,
  buildJourneySection,
  buildFitsSection,
} = require("../traits/dataManipulations/homeCms");
const cacheKey = cacheKeys.home;

class HomeService {
  static async getData() {
    try {
      const cachedData = await getCache(cacheKey);
      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "Data fetched from cache",
      //   };
      // }

      const [homeCms, banners, projects, fits] = await Promise.all([
        models.HomeCms.findOne({}),
        models.HomeBanner.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.Projects.findAll({
          attributes: ["id", "title", "title_ar", "thumbnail"],
          where: {
            show_in_home: true,
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.FindYourFits.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      const sliders = buildHomeBannerSliders(banners);
      const aboutSection = buildCmsSection(homeCms, "about");
      const formSection = buildCmsSection(homeCms, "form");
      const journeySection = buildJourneySection(homeCms, "journey");
      const featuredSection = buildTitleSection(homeCms, "featured");
      const projectSection = buildProjectsSection(projects, homeCms);
      const fitsSection = buildFitsSection(homeCms, fits);
      const brandsSection = buildTitleSection(homeCms, "brands");
      // const formsSection = buildFormSection(homeCms, "form");

      const result = {
        sliders,
        aboutSection,
        formSection,
        journeySection,
        featuredSection,
        projectSection,
        fitsSection,
        brandsSection,
        // formsSection
      };
      await setCache(cacheKey, result);

      return {
        data: result,
        fromCache: false,
        message: "Data fetched successfully",
      };
    } catch (error) {
      console.error("Error getting HOME data:", error);
      throw new Error(`Error fetching home data: ${error.message}`);
    }
  }
}

module.exports = HomeService;

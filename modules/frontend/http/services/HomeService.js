const { redisClient } = require("../../../../config/redis");
const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const { buildCmsSection, buildTitleSection } = require("../traits/dataManipulations.js/common");
const { buildHomeBannerSliders, buildProjectsSection } = require("../traits/dataManipulations.js/homeCms");
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

      const [homeCms, banners, projects] = await Promise.all([
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
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      const sliders = buildHomeBannerSliders(banners);
      const aboutSection = buildCmsSection(homeCms, "about");
      const formSection = buildCmsSection(homeCms, "form");
      const journeySection = buildCmsSection(homeCms, "journey");
      const featuredSection = buildTitleSection(homeCms, "featured");
      const projectSection = buildProjectsSection(projects, homeCms);
      const fitsSection = buildTitleSection(homeCms, "fits");
      const brandsSection = buildTitleSection(homeCms, "brands");

      // const projectsSection = await setCache(cacheKey, {
      //   sliders,
      //   aboutSection,
      //   formSection,
      //   journeySection,
      //   featuredSection,
      //   projectSection,
      //   fitsSection,
      //   brandsSection,
      // });

      return {
        data: {
          sliders,
          aboutSection,
          formSection,
          journeySection,
          featuredSection,
          projectSection,
          fitsSection,
          brandsSection,
        },
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

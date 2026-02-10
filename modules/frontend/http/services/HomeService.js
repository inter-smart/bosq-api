const { Op } = require("sequelize");
const { redisClient } = require("../../../../config/redis");
const { models } = require("../../../../database/models");

const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const {
  buildCmsSection,
  buildTitleSection,
  buildOtherMetaData,
} = require("../traits/dataManipulations/common");
const {
  buildHomeBannerSliders,
  buildProjectsSection,
  buildJourneySection,
  buildFitsSection,
  buildBrandSection,
  buildFormSection,
  buildFeaturedProductSection,
  buildSmartSpaceCalculatorSection,
} = require("../traits/dataManipulations/homeCms");
const cacheKey = cacheKeys.home;

class HomeService {
  static async getData() {
    try {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "Data fetched from cache",
        };
      }

      const [
        homeCms,
        banners,
        productCategory,
        projects,
        SmartSpaceCalculator,
        brands,
        fits,
        otherMeta,
      ] = await Promise.all([
        models.HomeCms.findOne({}),
        models.HomeBanner.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),

        models.ProductCategory.findAll({
          attributes: ["id", "name", "name_ar", "media_path", "slug"],
          where: {
            status: true,
            parent_id: {
              [Op.ne]: null,
            },
          },
          order: [["sort_order", "ASC"]],
        }),
        models.Projects.findAll({
          attributes: ["id", "title", "title_ar", "thumbnail", "slug"],
          where: {
            show_in_home: true,
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.SmartSpaceCalculator.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.HomeBrands.findAll({
          where: {
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
        models.MetaTags.findOne({
          where: {
            page: "home",
          },
          attributes: ["other_meta_ar", "other_meta"],
        }),
      ]);

      const sliders = buildHomeBannerSliders(banners);
      const aboutSection = buildCmsSection(homeCms, "about");
      const journeySection = buildJourneySection(homeCms, "journey");
      const featuredSection = buildFeaturedProductSection(
        homeCms,
        productCategory,
      );
      const projectSection = buildProjectsSection(projects, homeCms);
      const smartSpaceSection = buildSmartSpaceCalculatorSection(SmartSpaceCalculator);
      const fitsSection = buildFitsSection(homeCms, fits);
      const brandsSection = buildBrandSection(homeCms, brands);
      const formSection = buildCmsSection(homeCms, "form");
      const otherMetaTags = buildOtherMetaData(otherMeta);

      const result = {
        sliders,
        aboutSection,
        journeySection,
        featuredSection,
        projectSection,
        smartSpaceSection,
        fitsSection,
        brandsSection,
        formSection,
        otherMetaTags,
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

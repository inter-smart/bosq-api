const { Op } = require("sequelize");
const { redisClient } = require("../../../../config/redis");
const { models, sequelize } = require("../../../../database/models");

const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { generateImageUrl } = require("../../traits/imageUrlHelper");
const { buildCmsSection, buildTitleSection, buildOtherMetaData } = require("../traits/dataManipulations/common");
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
      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "Data fetched from cache",
      //   };
      // }

      const [homeCms, banners, productVariants, projects, SmartSpaceCalculator, brands, fits, otherMeta, state, enquiryDropdowns] = await Promise.all(
        [
          models.HomeCms.findOne({}),
          models.HomeBanner.findAll({
            where: {
              status: true,
            },
            order: [["sort_order", "ASC"]],
          }),

          models.ProductVariants.findAll({
            attributes: ["id", "title", "title_ar", "media_path", "sku"],
            where: {
              status: true,
              is_featured: true,
            },
            // order: [["sort_order", "ASC"]],
            limit: 6,

            include: [
              // base slug from productmodel
              {
                model: models.ProductModels,
                as: "productModel",
                attributes: ["id", "slug", "title"],
                include: [
                  {
                    model: models.ProductBase,
                    as: "product",
                    attributes: ["id", "slug"],
                  },
                ],
              },
              {
                model: models.ProductVariantAttributes,
                as: "variant_attributes",
                attributes: ["id", "attribute_id", "attribute_value_id"],
                include: [
                  {
                    model: models.ProductAttribute,
                    as: "ProductAttribute",
                    attributes: ["id", "name", "name_ar", "code", "slug"],
                  },
                  {
                    model: models.AttributeValues,
                    as: "AttributeValue",
                    attributes: ["id", "value", "value_ar", "slug"],
                  },
                ],
              },
            ],
          }),
          // product variant

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
          models.State.findAll({
            attributes: ["id", "name", "slug"],
            include: [
              {
                model: models.Country,
                as: "country",
                attributes: [], // ❌ hide country data
                where: {
                  slug: {
                    [Op.in]: ["om", "ae"], // Only Oman and UAE
                  },
                },
                required: true,
              },
            ],
          }),
          models.EnquiryDropdown.findAll({
            where: {
              status: true,
            },
            attributes: ["id", "title", "title_ar"],
            order: [["sort_order", "ASC"]],
          }),
        ],
      );

      const sliders = buildHomeBannerSliders(banners);
      const aboutSection = buildCmsSection(homeCms, "about");
      const journeySection = buildJourneySection(homeCms, "journey");
      const featuredSection = buildFeaturedProductSection(homeCms, productVariants);
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
        state,
        enquiryDropdowns,
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

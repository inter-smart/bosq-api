const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { buildJOurneySection, buildBosqSection, buildTestimonialSection, buildClientSection, buildNewsSection, buildABoutBannerSection } = require("../traits/dataManipulations/about");
const { buildTitleSection } = require("../traits/dataManipulations/common");

const cacheKey = cacheKeys.about;

class AboutService {
  static async getData() {
    try {
      const cachedData = await getCache(cacheKey);

      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "About page data fetched from cache",
      //   };
      // }

      const [aboutCms, aboutJourneys, whyBosq, aboutTestimonials, aboutOurClients, news] = await Promise.all([
        models.AboutCms.findOne(),
        models.AboutJourneys.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.WhyBosq.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.AboutTestimonials.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.AboutOurClients.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.News.findAll({
            where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
          attributes: ["id", "title", "title_ar", "thumbnail", "slug", 'name', 'published_date', 'thumbnail_alt', 'thumbnail_alt_ar'],
        })
      ]);

      const heroData = buildTitleSection(aboutCms);
      const aboutBannerData = buildABoutBannerSection(aboutCms);
      const journeyData = buildJOurneySection(aboutCms, aboutJourneys);
      const whyBosqData = buildBosqSection(aboutCms, whyBosq);
      const testimonialData = buildTestimonialSection(aboutCms, aboutTestimonials);
      const clientData = buildClientSection(aboutCms, aboutOurClients);
      const newsData = buildNewsSection(aboutCms, news);
      const result = {
        heroData,
        aboutBannerData,
        journeyData,
        whyBosqData,
        testimonialData,
        clientData,
        newsData
      };

      await setCache(cacheKey, result);

      return {
        data: result,
        fromCache: false,
        message: "About page data fetched",
      };
    } catch (error) {
      console.error("Error getting ABOUT PAGE data:", error);
      throw new Error(`Error fetching about page data: ${error.message}`);
    }
  }



}

module.exports = AboutService;
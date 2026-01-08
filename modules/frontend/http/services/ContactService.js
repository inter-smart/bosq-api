const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const { buildContactData } = require("../traits/dataManipulations/contact");

const cacheKey = cacheKeys.contact;

class ContactService {
  static async getData() {
    try {
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "Contact page data fetched from cache",
        };
      }

      const [contactInfo, socialMedia] = await Promise.all([
        models.ContactCms.findOne(),
        models.SocialMedia.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      if (!contactInfo) {
        throw new Error("No contact information found");
      }

      if (!socialMedia) {
        throw new Error("No social media information found");
      }

      const heroData = buildTitleSection(contactInfo);
      const contactData = buildContactData(contactInfo, socialMedia);

      const result = {
        heroData,
        contactData,
      };

      await setCache(cacheKey, result);

      return {
        data: result,
        fromCache: false,
        message: "Contact page data fetched",
      };
    } catch (error) {
      console.error("Error getting CONTACT PAGE data:", error);
      throw new Error(`Error fetching contact page data: ${error.message}`);
    }
  }



}

module.exports = ContactService;
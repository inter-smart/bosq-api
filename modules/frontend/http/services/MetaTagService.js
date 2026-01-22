const { models } = require("../../../../database/models");
const { ErrorHandler } = require("../traits/errorHandler");

class MetaTagService {
  /**
   * Get meta tags for a page according to language
   * @param {string} page - The page slug
   * @param {string} language - 'en' or 'ar'
   * @returns {object} meta tags
   */
  static async index(page, language = "en") {
    try {
      // Fetch record from DB
      const record = await models.MetaTags.findOne({ where: { page } });

      // fallback default meta
      const defaultMeta = {
        en: {
          meta_title: "BOSQ",
          meta_description: "Welcome to BOSQ",
          meta_keywords: "BOSQ",
          other_meta: "<meta name='author' content='BOSQ'>",
          canonical_url: "/",
        },
        ar: {
          meta_title: "بوسك",
          meta_description: "مرحبا بكم في بوسك",
          meta_keywords: "بوسك",
          other_meta: "<meta name='author' content='بوسك'>",
          canonical_url: "/ar",
        },
      };

      // If no record in DB, return default
      if (!record) {
        return defaultMeta[language] || defaultMeta.en;
      }

      const data = record.toJSON();

      // Build meta based on requested language
      const meta = {
        meta_title:
          language === "ar"
            ? data.meta_title_ar || data.meta_title || defaultMeta.ar.meta_title
            : data.meta_title || defaultMeta.en.meta_title,
        meta_description:
          language === "ar"
            ? data.meta_description_ar || data.meta_description || defaultMeta.ar.meta_description
            : data.meta_description || defaultMeta.en.meta_description,
        meta_keywords:
          language === "ar"
            ? data.meta_keywords_ar || data.meta_keywords || defaultMeta.ar.meta_keywords
            : data.meta_keywords || defaultMeta.en.meta_keywords,
        other_meta:
          language === "ar"
            ? data.other_meta_ar || data.other_meta || defaultMeta.ar.other_meta
            : data.other_meta || defaultMeta.en.other_meta,
      
      };

      return {
        data: meta,
        fromCache: false,
        message: "FAQs fetched successfully",
      };

    } catch (error) {
      // Do NOT pass null here; just throw the error
      throw error;
    }
  }
}

module.exports = MetaTagService;

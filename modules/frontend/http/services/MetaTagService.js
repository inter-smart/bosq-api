const { models } = require("../../../../database/models");
const { ErrorHandler } = require("../traits/errorHandler");

class MetaTagService {
  static async index(type, slug) {
    try {
      let data;

      switch (type) {
        case "blog":
          data = await models.Blogs.findOne({
            attributes: [
              "meta_title",
              "meta_description",
              "meta_keywords",
              "targeted_keywords",
              "other_meta_tags",
              "canonical_url",
            ],
            where: { slug },
          });
          break;

        case "news":
          data = await models.News.findOne({
            attributes: [
              "meta_title",
              "meta_description",
              "meta_keywords",
              "targeted_keywords",
              "other_meta_tags",
              "canonical_url",
            ],
            where: { slug },
          });
          break;

        case "common-page":
          data = await models.MetaTags.findOne({
            attributes: [
              "meta_title",
              "meta_description",
              "meta_keywords",
              "targeted_keywords",
              "other_meta_tags",
              "canonical_url",
            ],
            where: { page: slug },
          });
          break;

        default:
          return null; 
      }

      // fallback meta values
      const defaultMeta = {
        meta_title: "Go Ec",
        meta_description:
          "Welcome to Go Ec",
        meta_keywords: "Go Ec",
        targeted_keywords: "Go Ec",
        other_meta_tags: "<meta name='author' content='Go Ec'>",
        canonical_url: "/",
      };

      if (!data) {
        return defaultMeta;
      }

      data = data.toJSON();
      Object.keys(defaultMeta).forEach((key) => {
        if (!data[key]) {
          data[key] = defaultMeta[key];
        }
      });

      return data;
    } catch (error) {
      throw ErrorHandler.handleServiceError(error, null, "MetaTagService.index");
    }
  }
}

module.exports = MetaTagService;

const { models } = require("../../../../database/models");
const { mediaWithType, mediaWithoutType, singleMediaWithType, singleMediaWithoutType, button } = require('../traits/mediaButtonHelper');

class PolicyService {
  static async index(slug) {
    try {
      const cmsData = await models.Policy.findOne({
        where: { slug },
      });

      if (!cmsData) {
        throw new Error(`No CMS data found for slug: ${slug}`);
      }

      const data = {
        banner_section: this.buildBannerSection(cmsData),
        content: this.buildContentSection(cmsData),
      };

      return data;
    } catch (error) {
      throw new Error(`Error fetching policy page data: ${error.message}`);
    }
  }

  static buildBannerSection(cmsData) {
    return {
      banner_title: cmsData?.banner_title ?? "",
      media: mediaWithoutType(
        cmsData,
        "banner_media_desktop_path",
        "banner_media_mobile_path",
        "banner_media_alt"
      ),
    };
  }

  static buildContentSection(cmsData) {
    return {
      title: cmsData?.title ?? "",
      description: cmsData?.description ?? "",
    };
  }
}

module.exports = PolicyService;

const { models } = require("../../../../database/models");
const {
  buildHeaderSection,
  buildFooterSection,
  buildFooterIcons,
  buildNavigationData,
  buildPaymentCards,
} = require("../traits/dataManipulations/siteSettings");

class SiteSettingsService {
  static async getData() {
    try {
      const [siteSettings, socialLinks, paymentMethods, products, projects, landingPage] = await Promise.all([
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
            parent_id: null,
          },
          attributes: ["id", "name", "name_ar", "media_path", "slug"],
          include: [
            {
              model: models.ProductCategory,
              as: "children",
              attributes: ["id", "name", "name_ar", "media_path", "slug"],
              where: { status: true },
              required: false,
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

        await models.LandingPage.findAll({
          where: {
            status: true,
          },
          attributes: ["title", "title_ar", "slug"],
          order: [["sort_order", "ASC"]],
        }),
      ]);

      const headerData = buildHeaderSection(siteSettings);
      const footerData = buildFooterSection(siteSettings);
      const socialMedia = buildFooterIcons(socialLinks);
      const cards = buildPaymentCards(paymentMethods);
      const navigationData = buildNavigationData(products, projects);

      const result = {
        headerData,
        footerData,
        socialMedia,
        cards,
        navigationData,
        products,
        landingPage,
      };

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

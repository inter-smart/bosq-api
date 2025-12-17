const { models } = require("../../../../database/models");
const { sendErrorResponse } = require("../../../admin/http/traits/responseHandler");

class HomeService {
  static async getData() {
    try {
      const [banners, projects] = await Promise.all([
        models.HomeBanner.findAll({
          where: {
            status: true,
          },
          order: [["sort_order", "ASC"]],
        }),
        models.Projects.findAll({
          where: {
            show_in_home: true,
          },
          order: [["sort_order", "ASC"]],
        }),
      ]);

      function buildHomeBannerSliders(banners) {
        if (!Array.isArray(banners) || banners.length === 0) {
          return null;
        }

        const sliders = banners?.map((banner) => {
          return {
            id: banner.id,
            title: banner.title ?? "N/A",
            title_ar: banner.title_ar ?? "N/A",
            description: banner.description ?? "N/A",
            description_ar: banner.description_ar ?? "N/A",
            media_type: banner.media_type ?? "image",
            media_alt: banner.media_alt ?? null,
            media_alt_ar: banner.media_alt_ar ?? null,
            media: {
              desktop: {
                path: banner.media_desktop_path ?? null,
              },
              mobile: {
                path: banner.media_mobile_path ?? null,
              },
            },
          };
        });

        return sliders;
      }

      return {
        sliders: buildHomeBannerSliders(banners),
        projects,
      };
    } catch (error) {
      console.error("Error getting HOME data:", error);
      throw new Error(`Error fetching home data: ${error.message}`);
    }
  }
}

module.exports = HomeService;

const { models } = require("../../../../database/models");
const { mediaWithType, mediaWithoutType, singleMediaWithType, singleMediaWithoutType, button } = require('../traits/mediaButtonHelper');
const { Op } = require("sequelize");

class NewsService {

  static async index({ page = 1, limit = 10 } = {}) {
    try {
      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;

      const [cmsData = {}, News = [], allNewsPaginated] = await Promise.all([
        models.NewsCms.findOne(),

        // Featured News
        models.News.findAll({
          where: { status: true, is_featured_active: true },
          order: [["sort_order", "ASC"]],
        }),

        // Paginated all News
        models.News.findAndCountAll({
          where: { status: true },
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        }),
      ]);

      const featuredNews = News;

      const recentNews = await models.News.findAll({
        where: { status: true },
        order: [["createdAt", "DESC"]],
        limit: 6,
      });

      const allNews = {
        total: allNewsPaginated.count,
        currentPage: page,
        perPage: limit,
        totalPages: Math.ceil(allNewsPaginated.count / limit),
        data: allNewsPaginated.rows,
      };

      return {
        banner_section: this.buildBannerSection(cmsData, featuredNews),
        recents_News_section: this.buildRecentsNewsSection(cmsData, recentNews),
        all_News_section: this.buildAllNewsSection(cmsData, allNews.data),
        get_in_touch_section: this.buildGetInTouchSection(cmsData),
        pagination: {
          total: allNews.total,
          currentPage: allNews.currentPage,
          perPage: allNews.perPage,
          totalPages: allNews.totalPages,
        },
      };
    } catch (error) {
      throw new Error(`Error fetching New listing page data: ${error.message}`);
    }
  }



  static buildBannerSection(cmsData, featuredNews) {
    return {
      super_title: cmsData?.banner_super_title ?? "",
      title: cmsData?.banner_title ?? "",
      description: cmsData?.banner_description ?? "",
      list:
        featuredNews.map((item) => ({
          title: item?.title ?? "",
          slug: item?.slug ?? "",
          description: item?.description ?? "",
          reading_time: item?.reading_time ?? "",
          published_on: item?.published_on ?? "",
          media: singleMediaWithoutType(
            item,
            "thumbnail",
            "thumbnail_alt"
          ),
        })) || [],
    };
  }

  static buildRecentsNewsSection(cmsData, recentNews) {
    return {
      title: cmsData?.recent_New_title ?? "",
      list:
        recentNews.map((item) => ({
          title: item?.title ?? "",
          slug: item?.slug ?? "",
          description: item?.description ?? "",
          reading_time: item?.reading_time ?? "",
          published_on: item?.published_on ?? "",
          media: singleMediaWithoutType(
            item,
            "thumbnail",
            "thumbnail_alt"
          ),
        })) || [],
    };
  }

  static buildAllNewsSection(cmsData, allNews) {
    return {
      title: cmsData?.all_News_title ?? "",
      list:
        allNews.map((item) => ({
          title: item?.title ?? "",
          slug: item?.slug ?? "",
          description: item?.description ?? "",
          reading_time: item?.reading_time ?? "",
          published_on: item?.published_on ?? "",
          media: singleMediaWithoutType(
            item,
            "thumbnail",
            "thumbnail_alt"
          ),
        })) || [],
    };
  }

  static buildGetInTouchSection(cmsData) {
    return {
      title: cmsData?.footer_title ?? "",
      description: cmsData?.description ?? "",

    };
  }



  static async show(slug) {
    try {
      const cmsData = await models.NewCms.findOne();
      const New = await models.News.findOne({
        where: { slug, status: true },
      });

      if (!New) {
        throw new Error("New not found");
      }

      let similarNews = [];

      // Extract and clean keywords
      const words = New.title
        .toLowerCase()
        .split(" ")
        .filter(w => w.length > 3)
        .map(w => w.trim());

      if (words.length > 0) {
        // Try AND conditions first
        const andConditions = words.map(word => ({
          [Op.or]: [
            { title: { [Op.iLike]: `%${word}%` } },
            { description: { [Op.iLike]: `%${word}%` } }
          ]
        }));

        similarNews = await models.News.findAll({
          where: {
            status: true,
            id: { [Op.ne]: New.id },
            [Op.and]: andConditions,
          },
          limit: 3,
          order: [["createdAt", "DESC"]],
        });

        // Fallback to OR conditions if needed
        if (similarNews.length < 3) {
          const orConditions = words.map(word => ({
            [Op.or]: [
              { title: { [Op.iLike]: `%${word}%` } },
              { description: { [Op.iLike]: `%${word}%` } }
            ]
          }));

          similarNews = await models.News.findAll({
            where: {
              status: true,
              id: { [Op.ne]: New.id },
              [Op.or]: orConditions,
            },
            limit: 3,
            order: [["createdAt", "DESC"]],
          });
        }
      }

      // Final fallback: just get recent News
      if (similarNews.length < 3) {
        const remainingLimit = 3 - similarNews.length;
        const excludeIds = [New.id, ...similarNews.map(b => b.id)];

        const recentNews = await models.News.findAll({
          where: {
            status: true,
            id: { [Op.notIn]: excludeIds },
          },
          limit: remainingLimit,
          order: [["createdAt", "DESC"]],
        });

        similarNews = [...similarNews, ...recentNews];
      }

      return {
        New_details_section: this.buildNewDetailSection(New),
        similar_section: this.buildSimilarSection(similarNews),
        get_in_touch_section: this.buildGetInTouchDetailSection(cmsData),
      };
    } catch (error) {
      throw new Error(`Error fetching New detail: ${error.message}`);
    }
  }

  static buildNewDetailSection(New) {
    return {
      title: New?.title ?? "",
      slug: New?.slug ?? "",
      description: New?.description ?? "",
      reading_time: New?.reading_time ?? "",
      published_on: New?.published_on ?? "",
      media: mediaWithoutType(
        New,
        "banner_media_desktop_path",
        "banner_media_mobile_path",
        "banner_media_alt",
      ),
      sub_description: New?.sub_description ?? "",

    };
  }



  static buildSimilarSection(similarNews) {
    return {
      title: "Similar News",
      list:
        similarNews.map((item) => ({
          title: item?.title ?? "",
          slug: item?.slug ?? "",
          description: item?.description ?? "",
          reading_time: item?.reading_time ?? "",
          published_on: item?.published_on ?? "",
          media: singleMediaWithoutType(
            item,
            "thumbnail",
            "thumbnail_alt"
          ),
        })) || [],
    };
  }

  static buildGetInTouchDetailSection(cmsData) {
    return {
      title: cmsData?.footer_title ?? "",
      description: cmsData?.description ?? "",

    };
  }
}

module.exports = NewsService;

const { Op, literal, Error } = require("sequelize");
const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const {
  buildOtherMetaData,
  buildTitleSection,
} = require("../traits/dataManipulations/common");
const {
  buildRelatedNewsSection,
  buildNewsDetailsData,
  extractKeywords,
  buildNewsData,
} = require("../traits/dataManipulations/newsCms");
const { buildHeroData } = require("../traits/dataManipulations/blogCms");

const cacheKey = cacheKeys.news;

class newservice {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "News page data fetched from cache",
        };
      }

      //   3. If no cached data, fetch from database
      const [newsCms, news] = await Promise.all([
        models.NewsCms.findOne(),
        models.News.findAll({
          where: {
            status: true,
          },
          order: [["updatedAt", "ASC"]],
        }),
      ]);

      if (!newsCms) {
        throw new Error("No news CMS data found");
      }

      if (!news) {
        throw new Error("No news found");
      }

      //   4. Process and structure the data
      const heroData = buildHeroData(newsCms);
      const result = {
        heroData,
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "News page data fetched",
      };
    } catch (error) {
      console.error("Error getting NEWS PAGE data:", error);
      throw new Error(`Error fetching news page data: ${error.message}`);
    }
  }

  static async getNews(req) {
    try {
      const { page = 1, limit = 6 } = req.query;
      const parsedPage = parseInt(page, 10) || 1;
      const parsedLimit = parseInt(limit, 10) || 6;
      const offset = (parsedPage - 1) * parsedLimit;

      const newsListCacheKey = cacheKeys.newsList(parsedPage, parsedLimit);
      const cachedData = await getCache(newsListCacheKey);

      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "News list data fetched from cache",
        };
      }

      const { count, rows } = await models.News.findAndCountAll({
        where: { status: true },
        order: [["updatedAt", "ASC"]],
        limit: parsedLimit,
        offset,
      });

      const newsData = buildNewsData(rows);
      const totalPages = Math.ceil(count / parsedLimit);

      const result = {
        ...newsData,
        pagination: {
          totalCount: count,
          totalPages,
          currentPage: parsedPage,
          limit: parsedLimit,
        },
      };

      await setCache(newsListCacheKey, result);

      return {
        data: result,
        message: "News fetched successfully",
      };
    } catch (error) {
      console.error("Error getting NEWS LIST data:", error);
      throw new Error(`Error fetching news list data: ${error.message}`);
    }
  }

  // slug page
  static async show(slug) {
    try {
      if (!slug) {
        throw new Error("No slug found");
      }

      const cachedData = await getCache(`${cacheKey}:${slug}`);

      // 2. If cached data exists, return it
      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "news detail page data fetched from cache",
      //   };
      // }

      const [cms, news] = await Promise.all([
        models.NewsCms.findOne(
          // only fetch related blog title
          {
            attributes: [
              "title",
              "title_ar",
              "related_news_title",
              "related_news_title_ar",
              "popular_news_title",
              "popular_news_title_ar",
            ],
          },
        ),
        models.News.findOne({
          where: {
            slug,
          },
        }),
      ]);

      if (!news) {
        throw new Error("No news found");
      }

      const enKeywords = extractKeywords(news?.title || "");
      const arKeywords = extractKeywords(news?.title_ar || "");
      const keywords = [...new Set([...enKeywords, ...arKeywords])].slice(0, 5);

      const [prevnews, nextnews, relatednews, popularnews] = await Promise.all([
        models.News.findOne({
          attributes: ["slug"],
          where: {
            updatedAt: { [Op.lt]: news?.updatedAt },
            status: true,
          },
          order: [["updatedAt", "DESC"]],
        }),

        models.News.findOne({
          attributes: ["slug"],
          where: {
            updatedAt: { [Op.gt]: news?.updatedAt },
            status: true,
          },
          order: [["updatedAt", "ASC"]],
        }),

        keywords.length
          ? models.News.findAll({
              attributes: [
                "slug",
                "title",
                "title_ar",
                "thumbnail",
                "thumbnail_alt",
                "thumbnail_alt_ar",
                "published_date",
              ],
              where: {
                [Op.and]: [
                  literal(`
            id != '${news.id}'
            AND (
              (
                SELECT COUNT(*)
                FROM unnest(ARRAY[${keywords.map((k) => `'${k}'`).join(",")}]) AS kw
                WHERE to_tsvector('simple', title || ' ' || coalesce(title_ar, ''))
                  @@ plainto_tsquery('simple', kw)
              ) >= 2
              OR
              (
                SELECT COUNT(*)
                FROM unnest(tsvector_to_array(
                  to_tsvector('simple', title || ' ' || coalesce(title_ar, ''))
                )) AS word
                WHERE to_tsvector('simple', '${(news.title + " " + (news.title_ar || "")).replace(/'/g, "''")}')
                  @@ plainto_tsquery('simple', word)
              ) >= 2
            )
          `),
                  { status: true },
                ],
              },
              limit: 5,
              order: [["createdAt", "DESC"]],
            })
          : Promise.resolve([]),

        models.News.findAll({
          where: {
            status: true,
            id: { [Op.ne]: news.id },
          },
          attributes: [
            "slug",
            "title",
            "title_ar",
            "thumbnail",
            "thumbnail_alt",
            "thumbnail_alt_ar",
            "published_date",
          ],
          limit: 5,
          order: [["viewCount", "DESC"]],
        }),
      ]);

      const heroData = buildTitleSection(cms);
      const newsData = buildNewsDetailsData(news, nextnews, prevnews);
      const relatedNewsData = buildRelatedNewsSection(
        cms,
        relatednews,
        "related_news",
      );
      const popularNewsData = buildRelatedNewsSection(
        cms,
        popularnews,
        "popular_news",
      );
      const metaData = buildOtherMetaData(news);

      const result = {
        heroData,
        newsData,
        popularNewsData,
        relatedNewsData,
        metaData,
      };

      await setCache(`${cacheKey}:${slug}`, result);

      return {
        data: result,
        message: "news detail page data fetched",
      };
    } catch (error) {
      console.error("Error getting news PAGE data:", error);
      throw new Error(`Error fetching news page data: ${error.message}`);
    }
  }

  static async incrementView(slug) {
    if (!slug) {
      throw new Error("No slug provided");
    }
    await models.News.increment("viewCount", {
      where: { slug, status: true },
    });
  }
}

module.exports = newservice;

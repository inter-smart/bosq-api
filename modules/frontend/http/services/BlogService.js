const { Op, literal } = require("sequelize");
const { models } = require("../../../../database/models");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const {
  buildBlogData,
  buildHeroData,
  buildTitleConditions,
  extractKeywords,
  buildRelatedBlogSection,
  buildBlogDetailsData,
} = require("../traits/dataManipulations/blogCms");
const {
  buildTitleSection,
  buildOtherMetaData,
} = require("../traits/dataManipulations/common");

const cacheKey = cacheKeys.blog;

class BlogService {
  static async getData() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "Blog page data fetched from cache",
        };
      }

      //   3. If no cached data, fetch from database
      const [blogCms, blogs] = await Promise.all([
        models.BlogCms.findOne(),
        models.Blogs.findAll({
          where: {
            status: true,
          },
          order: [["updatedAt", "ASC"]],
        }),
      ]);

      if (!blogCms) {
        throw new Error("No blog CMS data found");
      }

      if (!blogs) {
        throw new Error("No blogs found");
      }

      //   4. Process and structure the data
      const heroData = buildHeroData(blogCms);
      const result = {
        heroData,
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "Blog page data fetched",
      };
    } catch (error) {
      console.error("Error getting BLOG PAGE data:", error);
      throw new Error(`Error fetching blog page data: ${error.message}`);
    }
  }

  static async getBlogs(req) {
    try {
      const { page = 1, limit = 6 } = req.query;
      const parsedPage = parseInt(page, 10) || 1;
      const parsedLimit = parseInt(limit, 10) || 6;
      const offset = (parsedPage - 1) * parsedLimit;

      const blogListCacheKey = cacheKeys.blogList(parsedPage, parsedLimit);
      const cachedData = await getCache(blogListCacheKey);

      // if (cachedData) {
      //   return {
      //     data: cachedData,
      //     fromCache: true,
      //     message: "Blog list data fetched from cache",
      //   };
      // }

      const { count, rows } = await models.Blogs.findAndCountAll({
        where: { status: true },
        order: [["updatedAt", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const blogData = buildBlogData(rows);
      const totalPages = Math.ceil(count / parsedLimit);

      const result = {
        ...blogData,
        pagination: {
          totalCount: count,
          totalPages,
          currentPage: parsedPage,
          limit: parsedLimit,
        },
      };

      await setCache(blogListCacheKey, result);

      return {
        data: result,
        message: "Blogs fetched successfully",
      };
    } catch (error) {
      console.error("Error getting BLOG LIST data:", error);
      throw new Error(`Error fetching blog list data: ${error.message}`);
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
      //     message: "Blog detail page data fetched from cache",
      //   };
      // }

      const [cms, blog] = await Promise.all([
        models.BlogCms.findOne(
          // only fetch related blog title
          {
            attributes: [
              "title",
              "title_ar",
              "related_blogs_title",
              "related_blogs_title_ar",
              "popular_blogs_title",
              "popular_blogs_title_ar",
            ],
          },
        ),
        models.Blogs.findOne({
          where: {
            slug,
          },
        }),
      ]);

      const keywords = extractKeywords(blog.title || blog.title_ar).slice(0, 3);

      const [prevBlog, nextBlog, relatedBlogs, popularBlogs] =
        await Promise.all([
          models.Blogs.findOne({
            attributes: ["slug"],
            where: {
              updatedAt: { [Op.gt]: blog.updatedAt },
              status: true,
            },
            order: [["updatedAt", "ASC"]],
          }),

          models.Blogs.findOne({
            attributes: ["slug"],
            where: {
              updatedAt: { [Op.lt]: blog.updatedAt },
              status: true,
            },
            order: [["updatedAt", "DESC"]],
          }),

          keywords.length
            ? models.Blogs.findAll({
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
            to_tsvector('simple', title || ' ' || coalesce(title_ar, ''))
            @@ plainto_tsquery('simple', '${keywords.join(" ")}')
          `),
                    {
                      id: { [Op.ne]: blog.id },
                    },
                    {
                      status: true,
                    },
                  ],
                },

                limit: 5,
                order: [["updatedAt", "DESC"]],
              })
            : Promise.resolve([]),

          models.Blogs.findAll({
            where: {
              status: true,
              id: { [Op.ne]: blog.id }, 
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
      const blogData = buildBlogDetailsData(blog, nextBlog, prevBlog);
      const relatedBlogData = buildRelatedBlogSection(
        cms,
        relatedBlogs,
        "related_blogs",
      );
      const popularBlogData = buildRelatedBlogSection(
        cms,
        popularBlogs,
        "popular_blogs",
      );

      const metaData = buildOtherMetaData(blog);

      const result = {
        heroData,
        blogData,
        popularBlogData,
        relatedBlogData,
        metaData,
      };

      await setCache(`${cacheKey}:${slug}`, result);

      return {
        data: result,
        message: "Blog detail page data fetched",
      };
    } catch (error) {
      console.error("Error getting BLOG PAGE data:", error);
      throw new Error(`Error fetching blog page data: ${error.message}`);
    }
  }
  static async incrementView(slug) {
    if (!slug) {
      throw new Error("No slug provided");
    }
    await models.Blogs.increment("viewCount", {
      where: { slug, status: true },
    });
  }
}

module.exports = BlogService;

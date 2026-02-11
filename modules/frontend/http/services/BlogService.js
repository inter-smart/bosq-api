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
const { buildTitleSection, buildOtherMetaData } = require("../traits/dataManipulations/common");

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
          order: [["sort_order", "ASC"]],
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
      const blogData = buildBlogData(blogs);
      const result = {
        heroData,
        blogData,
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
          }
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
              createdAt: { [Op.lt]: blog.createdAt },
              status: true
            },
            order: [["createdAt", "DESC"]],
          }),

          models.Blogs.findOne({
            attributes: ["slug"],
            where: {
              createdAt: { [Op.gt]: blog.createdAt },
              status: true
            },
            order: [["createdAt", "ASC"]],
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
                      status: true
                    }
                  ],
                },

                limit: 5,
                order: [["createdAt", "DESC"]],
              })
            : Promise.resolve([]),

          models.Blogs.findAll({
            where:{
              status: true
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
            order: [["createdAt", "DESC"]],
          }),
        ]);

      const heroData = buildTitleSection(cms);
      const blogData = buildBlogDetailsData(blog, prevBlog, nextBlog);
      const relatedBlogData = buildRelatedBlogSection(
        cms,
        relatedBlogs,
        "related_blogs"
      );
      const popularBlogData = buildRelatedBlogSection(
        cms,
        popularBlogs,
        "popular_blogs"
      );

      const metaData = buildOtherMetaData(blog);

      const result = {
        heroData,
        blogData,
        popularBlogData,
        relatedBlogData,
        metaData
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
}

module.exports = BlogService;

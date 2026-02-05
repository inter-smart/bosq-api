const { models } = require("../../../../database/models");
const {
  sendErrorResponse,
} = require("../../../admin/http/traits/responseHandler.js");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const {
  buildProjectCategorySection,
  buildProjectBannerSection,
  buildProjectListSection,
} = require("../traits/dataManipulations/projects.js");

const cacheKey = cacheKeys.projects;

class PrivacyPolicyService {
  static async index() {
    try {
      // 1. Get data from cache
      const cachedData = await getCache(cacheKey);

      // 2. If cached data exists, return it
      //   if (cachedData) {
      //     return {
      //       data: cachedData,
      //       fromCache: true,
      //       message: "project page data fetched from cache",
      //     };
      //   }

      //   3. If no cached data, fetch from database
      const [projectCMS, projectCategory] = await Promise.all([
        models.ProjectsCms.findOne(),
        models.ProjectCategories.findAll({
          where: { status: true },
          order: [["sort_order", "ASC"]],
          include: [
            {
              model: models.Projects,
              as: "projects",
              required: true, // INNER JOIN
              where: { status: true }, // only active projects
            },
          ]
        }),
      ]);

      if (!projectCMS) {
        throw new Error("No project CMS data found");
      }

      if (!projectCategory) {
        throw new Error("No project CMS data found");
      }

      //   4. Process and structure the data
      const heroData = buildTitleSection(projectCMS);
      const projectInfo = buildProjectBannerSection(projectCMS, "banner");
      const projectCategories = buildProjectCategorySection(projectCategory);
      const result = {
        heroData,
        projectInfo,
        projectCategories,
      };

      //   5. Store the result in cache for future requests
      await setCache(cacheKey, result);

      //   6. Return the result
      return {
        data: result,
        message: "project page data fetched",
      };
    } catch (error) {
      console.error("Error getting project PAGE data:", error);
      throw new Error(`Error fetching project page data: ${error.message}`);
    }
  }

  static async getProjectBySlug(req, res) {
    try {
      const { slug } = req.query;

      let projects;

      if (slug === "all") {
        projects = await models.Projects.findAll({
          where: {
            status: true,
          },
          attributes: ["slug", "title", "title_ar", "thumbnail"],
          order: [["sort_order", "ASC"]],
        });
      } else {
        projects = await models.Projects.findAll({
          where: {
            status: true,
          },
          attributes: ["slug", "title", "title_ar", "thumbnail"],
          include: [
            {
              model: models.ProjectCategories,
              as: "project_categories",
              attributes: [], // 👈 exclude category data
              required: true, // INNER JOIN
              where: { status: true, slug }, // only active categories
            },
          ],
          order: [["sort_order", "ASC"]],
        });
      }

      if (!projects || projects.length === 0) {
        sendErrorResponse(res, "Project not found", "Project not found", 404);
      }


      const projectData = buildProjectListSection(projects);

      return {
        data: projectData,
        message: "project page data fetched",
      };
    } catch (error) {
      console.error("Error getting project PAGE data:", error);
      throw new Error(`Error fetching project page data: ${error.message}`);
    }
  }


  static async show(req, res) {
    try {
      const { slug } = req.query;
     
      console.log(req.query)


      if(!slug){
        sendErrorResponse(res, "Project not found", "Project not found", 404);
      }

        const projects = await models.Projects.findAll({
          where: {
            status: true,
            slug
          },
          order: [["sort_order", "ASC"]],
        });

      if (!projects || projects.length === 0) {
        sendErrorResponse(res, "Project not found", "Project not found", 404);
      }



      return {
        data: projects,
        message: "project page data fetched",
      };
    } catch (error) {
      console.error("Error getting project PAGE data:", error);
      throw new Error(`Error fetching project page data: ${error.message}`);
    }
  }


}

module.exports = PrivacyPolicyService;

const { models } = require("../../../../database/models");
const {
  sendErrorResponse,
} = require("../../../admin/http/traits/responseHandler.js");
const cacheKeys = require("../../../redis/cacheKeys");
const { setCache, getCache } = require("../../../redis/redisService");
const {
  buildTitleSection,
  buildCmsSection,
} = require("../traits/dataManipulations/common");
const {
  buildProjectCategorySection,
  buildProjectBannerSection,
  buildProjectListSection,
  buildProjectDetailsSection,
  buildProfileTitleSection,
  buildSpecialisedAreaSection,
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
          ],
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
      const { slug, limit = 6 } = req.query;

      let queryOptions = {
        where: {
          status: true,
        },
        attributes: [
          "id",
          "slug",
          "title",
          "title_ar",
          "thumbnail",
          "section3_title",
        ],
        order: [["sort_order", "ASC"]],
        limit: parseInt(limit),
      };

      let countOptions = {
        where: {
          status: true,
        },
      };
      if (slug !== "all") {
        const categoryFilter = {
          model: models.ProjectCategories,
          as: "project_categories",
          attributes: [],
          required: true,
          where: { status: true, slug },
        };

        queryOptions.include = [categoryFilter];
        countOptions.include = [categoryFilter];
      }

      const [projects, totalCount] = await Promise.all([
        models.Projects.findAll(queryOptions),
        models.Projects.count(countOptions),
      ]);

      if (!projects || projects.length === 0) {
        throw new Error("No project data found");
      }

      const projectData = buildProjectListSection(projects);

      return res.status(200).json({
        success: true,
        data: {
          projects: projectData,
          totalItems: totalCount,
          currentLimit: parseInt(limit),
          hasMore: parseInt(limit) < totalCount,
        },
        message: "Projects fetched successfully",
      });
    } catch (error) {
      console.error("Error getting project PAGE data:", error);
      throw error;
    }
  }

  static async show(req, res) {
    try {
      const { slug } = req.query;

      console.log(req.query);

      if (!slug) {
        sendErrorResponse(res, "Project not found", "Project not found", 404);
      }

      const [cms, projects] = await Promise.all([
        models.ProjectsCms.findOne({
          attributes: [
            "form_title",
            "form_title_ar",
            "form_description",
            "form_description_ar",
            "form_media_path",
            "form_media_alt",
            "form_media_alt_ar",
          ],
        }),
        models.Projects.findOne({
          where: {
            status: true,
            slug,
          },
          order: [["sort_order", "ASC"]],
          include: [
            {
              model: models.SpecialisedAreas,
              as: "specialised_areas",
              where: { status: true },
              required: false,
            },
            {
              model: models.ProjectImage,
              as: "project_images",
              where: { status: true },
              required: false,
            },
          ],
        }),
      ]);

      if (!cms || cms.length === 0) {
        sendErrorResponse(res, "Project not found", "Project not found", 404);
      }

      const heroData = buildProfileTitleSection(projects);
      const projectData = buildProjectDetailsSection(projects);
      const solutionData = buildCmsSection(projects, "section3");
      const specializedAreasData = buildSpecialisedAreaSection(projects);
      const enquiryData = buildCmsSection(cms, "form");

      const result = {
        heroData,
        projectData,
        solutionData,
        specializedAreasData,
        enquiryData,
        projects,
      };

      return {
        data: result,
        message: "project page data fetched",
      };
    } catch (error) {
      console.error("Error getting project PAGE data:", error);
      throw new Error(`Error fetching project page data: ${error.message}`);
    }
  }
}

module.exports = PrivacyPolicyService;

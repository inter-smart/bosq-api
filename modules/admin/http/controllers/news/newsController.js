const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler");
const {
  validationRequestPost,
  validateId,
} = require("../../request/news/newsRequest");
const {
  handleFileUploadStore,
  handleFileUploadUpdate,
} = require("../../middleware/multerMiddleware");
const { paginate } = require("../../traits/datatablePaginationHelper");
const slugify = require("slugify");
const { Op } = require("sequelize");
const { invalidateCache } = require("../../../../redis/redisService");
const cacheKeys = require("../../../../redis/cacheKeys");

const DataModel = models.News;

class NewsController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["title", "slug"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "News retrieved successfully");
    } catch (error) {
      console.error("News index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Create news
  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { title } = req.body;

      if (!title || title.trim() === "")
        return sendErrorResponse(
          res,
          "Title is required to generate slug",
          null,
          400,
        );

      let baseSlug = slugify(title.trim(), { lower: true, strict: true });

      const existing = await DataModel.findOne({
        where: { slug: baseSlug },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          `Slug "${baseSlug}" already exists`,
          { existing_id: existing.id },
          409,
        );
      }

      req.body.slug = baseSlug;

      // ✅ Handle file uploads
      const fileFields = [
        "thumbnail",
        "media_desktop_path",
        "media_mobile_path",
      ];
      handleFileUploadStore(req, fileFields);

      // ✅ Create news
      const news = await DataModel.create(req.body, { transaction });
      await invalidateCache(cacheKeys.news);
      await transaction.commit();

      // Fetch with association
      const createdData = await DataModel.findByPk(news.id);

      sendSuccessResponse(res, createdData, "News created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("News creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Get single news
  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) return sendNotFoundError(res, "News");

      sendSuccessResponse(res, data, "News retrieved successfully");
    } catch (error) {
      console.error("News show error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Update news
  static async update(req, res) {
    await Promise.all(
      [...validateId, ...validationRequestPost].map((v) => v.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { title } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "News");
      }

      // ✅ Slug validation + prevent duplicates
      if (title && title.trim() !== data.title) {
        const newSlug = slugify(title.trim(), { lower: true, strict: true });

        // Check if slug exists for OTHER news
        const existing = await DataModel.findOne({
          where: {
            slug: { [Op.iLike]: newSlug },
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });

        if (existing) {
          await transaction.rollback();
          return sendErrorResponse(
            res,
            `Slug "${newSlug}" already exists`,
            { existing_id: existing.id },
            409,
          );
        }

        req.body.slug = newSlug;
      }

      // -----------------------------------------
      // ✅ File uploads handling
      // -----------------------------------------
      const fileFields = [
        "thumbnail",
        "media_desktop_path",
        "media_mobile_path",
      ];
      await handleFileUploadUpdate(req, data, fileFields);

      // -----------------------------------------
      // ✅ Update database
      // -----------------------------------------
      await data.update(req.body, { transaction });
      await invalidateCache(cacheKeys.news);
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);

      sendSuccessResponse(res, updatedData, "News updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("News update error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Delete news
  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) return sendNotFoundError(res, "News");

      await data.destroy();
      await invalidateCache(cacheKeys.news);
      sendSuccessResponse(res, { id }, "News deleted successfully");
    } catch (error) {
      console.error("News deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = NewsController;

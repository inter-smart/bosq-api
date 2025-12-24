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
} = require("../../../http/request/blog/BlogsRequest");
const {
  handleFileUploadStore,
  handleFileUploadUpdate,
} = require("../../middleware/multerMiddleware");
const { paginate } = require("../../../http/traits/datatablePaginationHelper");
const slugify = require("slugify");
const { Op } = require("sequelize");
const cacheKeys = require("../../../../redis/cacheKeys");
const { invalidateCache } = require("../../../../redis/redisService");

const DataModel = models.Blogs;
const cacheKey = cacheKeys.blog;

class BlogController {
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

      sendSuccessResponse(res, response, "Blogs retrieved successfully");
    } catch (error) {
      console.error("Blogs index error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Create blog
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
          400
        );

      // Generate slug
      const baseSlug = slugify(title.trim(), { lower: true, strict: true });

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
          409
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

      // ✅ Create blog
      const blog = await DataModel.create(req.body, { transaction });
      await invalidateCache(cacheKey);
      await transaction.commit();

      // Fetch with association
      const createdData = await DataModel.findByPk(blog.id);

      sendSuccessResponse(res, createdData, "Blog created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Blog creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Get single blog
  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) return sendNotFoundError(res, "Blog");

      sendSuccessResponse(res, data, "Blog retrieved successfully");
    } catch (error) {
      console.error("Blog show error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Update blog
  static async update(req, res) {
    await Promise.all(
      [...validateId, ...validationRequestPost].map((v) => v.run(req))
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
        return sendNotFoundError(res, "Blog");
      }

      // ✅ Slug validation + prevent duplicates
      if (title && title.trim() !== data.title) {
        const bloglug = slugify(title.trim(), { lower: true, strict: true });

        // Check if slug exists for OTHER blogs
        const existing = await DataModel.findOne({
          where: {
            slug: { [Op.iLike]: bloglug },
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });

        if (existing) {
          await transaction.rollback();
          return sendErrorResponse(
            res,
            `Slug "${bloglug}" already exists`,
            { existing_id: existing.id },
            409
          );
        }

        req.body.slug = bloglug;
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
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);
      await invalidateCache(cacheKey);

      sendSuccessResponse(res, updatedData, "Blog updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Blog update error:", error);
      sendErrorResponse(res, error);
    }
  }

  // ✅ Delete blog
  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) return sendNotFoundError(res, "Blog");

      await data.destroy();

      await invalidateCache(cacheKey);

      sendSuccessResponse(res, { id }, "Blog deleted successfully");
    } catch (error) {
      console.error("Blog deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = BlogController;

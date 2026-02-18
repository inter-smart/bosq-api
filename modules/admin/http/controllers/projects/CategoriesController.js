const { validationResult } = require("express-validator");
const {
  models,
  sequelize,
} = require("../../../../../database/models/index.js");
const {
  validationProjectCategories,
  validateId,
} = require("../../request/projects/categoriesRequest.js");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler.js");
const { paginate } = require("../../traits/datatablePaginationHelper.js");
const { Op } = require("sequelize");
const slugify = require("slugify");

const cacheKeys = require("../../../../redis/cacheKeys");
const { invalidateCache } = require("../../../../redis/redisService");

const DataModel = models.ProjectCategories;
const cacheKey = cacheKeys.projects;

class ProjectCategoriesController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["name", "name_ar", "slug"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Data retrieved successfully");
    } catch (error) {
      console.error("Data index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(
      validationProjectCategories.map((validation) => validation.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { name } = req.body;

      if (!name || name.trim() === "")
        return sendErrorResponse(
          res,
          "Name is required to generate slug",
          null,
          400
        );

      // Generate slug
      const baseSlug = slugify(name.trim(), { lower: true, strict: true });

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

      // Create data with transaction
      const data = await DataModel.create(req.body, { transaction });
      await invalidateCache(cacheKey);
      await invalidateCache(`project:category:detail:${baseSlug}`);

      // Commit the transaction
      await transaction.commit();
      sendSuccessResponse(res, data, "Data created successfully", 201);
    } catch (error) {
      console.error("Data creation error:", error);
      await transaction.rollback();
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    // Run ID validation
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) {
        return sendNotFoundError(res, "Data");
      }

      sendSuccessResponse(res, data, "Data retrieved successfully");
    } catch (error) {
      console.error("Data show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all(
      [...validateId, ...validationProjectCategories].map((v) => v.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { name } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Data");
      }

      const oldSlug = data.slug;

      // ✅ Slug validation + prevent duplicates
      if (name && name.trim() !== data.name) {
        const categorySlug = slugify(name.trim(), { lower: true, strict: true });

        // Check if slug exists for OTHER categories
        const existing = await DataModel.findOne({
          where: {
            slug: { [Op.iLike]: categorySlug },
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });

        if (existing) {
          await transaction.rollback();
          return sendErrorResponse(
            res,
            `Slug "${categorySlug}" already exists`,
            { existing_id: existing.id },
            409
          );
        }

        req.body.slug = categorySlug;
      }

      await data.update(req.body, { transaction });
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);
      const newSlug = updatedData.slug;
      if (oldSlug) {
        await invalidateCache(`project:category:detail:${oldSlug}`);
      }

      // Invalidate NEW detail cache (if changed)
      if (newSlug && newSlug !== oldSlug) {
        await invalidateCache(`project:category:detail:${newSlug}`);
      }
      await invalidateCache(cacheKey);

      return sendSuccessResponse(res, updatedData, "Data updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Data update error:", error);
      return sendErrorResponse(res, error);
    }
  }

  static async destroy(req, res) {
    // Run ID validation
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) {
        return sendNotFoundError(res, "Data");
      }

      const slug = data.slug;

      // Soft delete
      await data.destroy();

      await invalidateCache(cacheKey);

      if (slug) {
        await invalidateCache(`project:category:detail:${slug}`);
      }

      sendSuccessResponse(res, { id }, "Data deleted successfully");
    } catch (error) {
      console.error("Data deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProjectCategoriesController;

const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productSectorsRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");

const DataModel = models.ProductSectors;

class ProductSectorsController {
  static async generateUniqueSlug(name, ignoreId = null) {
    const baseSlug = slugify(name.trim(), { lower: true, strict: true });

    // Check for any slugs starting with the baseSlug
    const whereClause = {
      slug: { [Op.like]: `${baseSlug}%` },
    };

    // Exclude current record if updating
    if (ignoreId) {
      whereClause.id = { [Op.ne]: ignoreId };
    }

    const duplicates = await DataModel.findAll({
      where: whereClause,
      attributes: ["slug"],
      paranoid: false,
    });

    if (duplicates.length === 0) return baseSlug;

    const slugSet = new Set(duplicates.map((d) => d.slug));

    // If exact baseSlug not taken, use it
    if (!slugSet.has(baseSlug)) return baseSlug;

    // Otherwise find next available counter
    let counter = 1;
    while (slugSet.has(`${baseSlug}-${counter}`)) {
      counter++;
    }

    return `${baseSlug}-${counter}`;
  }

  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["name", "slug", "code"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product Sectors retrieved successfully");
    } catch (error) {
      console.error("Product Sectors index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { name, code } = req.body;

      if (!name || name.trim() === "") return sendErrorResponse(res, "Name is required to generate slug", null, 400);

      // Check for existing name or code
      const existing = await DataModel.findOne({
        where: {
          [Op.or]: [{ name: name.trim() }, { code: code.trim() }],
        },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        if (existing.name === name.trim()) {
          return sendErrorResponse(res, `Name "${name}" already exists`, { existing_id: existing.id }, 409);
        }
        if (existing.code === code.trim()) {
          return sendErrorResponse(res, `Code "${code}" already exists`, { existing_id: existing.id }, 409);
        }
      }

      const newSlug = await ProductSectorsController.generateUniqueSlug(name);
      req.body.slug = newSlug;

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const productSector = await DataModel.create(req.body, { transaction });
      await transaction.commit();

      const createdData = await DataModel.findByPk(productSector.id);

      sendSuccessResponse(res, createdData, "Product Sector created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product Sector creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);

      if (!data) return sendNotFoundError(res, "Product Sector");

      sendSuccessResponse(res, data, "Product Sector retrieved successfully");
    } catch (error) {
      console.error("Product Sector show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all([...validateId, ...validationRequestPost].map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { name, code } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Sector");
      }

      if (name && name.trim() !== data.name) {
        const existingName = await DataModel.findOne({
          where: {
            name: name.trim(),
            id: { [Op.ne]: id },
          },
          paranoid: false,
        });

        if (existingName) {
          await transaction.rollback();
          return sendErrorResponse(res, `Name "${name}" already exists`, { existing_id: existingName.id }, 409);
        }

        const newSlug = await ProductSectorsController.generateUniqueSlug(name, id);
        req.body.slug = newSlug;
      }

      if (code && code.trim() !== data.code) {
        const existingCode = await DataModel.findOne({
          where: {
            code: code.trim(),
            id: { [Op.ne]: id },
          },
          paranoid: false,
        });

        if (existingCode) {
          await transaction.rollback();
          return sendErrorResponse(res, `Code "${code}" already exists`, { existing_id: existingCode.id }, 409);
        }
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      await data.update(req.body, { transaction });
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);

      sendSuccessResponse(res, updatedData, "Product Sector updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Sector update error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id);
      if (!data) return sendNotFoundError(res, "Product Sector");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Product Sector deleted successfully");
    } catch (error) {
      console.error("Product Sector deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductSectorsController;

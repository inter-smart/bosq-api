const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/attributeValuesRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");

const DataModel = models.AttributeValues;

class AttributeValuesController {
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
      paranoid: true,
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
      const { attribute_id } = req.query;

      const whereClause = {};
      if (attribute_id) {
        whereClause.attribute_id = attribute_id;
      }

      const result = await paginate(DataModel, req, {
        where: whereClause,
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["value", "value_ar", "slug"],
        include: [
          {
            model: models.ProductAttribute,
            as: "attribute",
            attributes: ["id", "name", "name_ar", "code"],
          },
        ],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Attribute Values retrieved successfully");
    } catch (error) {
      console.error("Attribute Values index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { value, attribute_id } = req.body;

      if (!value || value.trim() === "") return sendErrorResponse(res, "Value is required to generate slug", null, 400);

      // Verify attribute exists
      const attribute = await models.ProductAttribute.findByPk(attribute_id);
      if (!attribute) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Attribute");
      }

      const newSlug = await AttributeValuesController.generateUniqueSlug(value);
      req.body.slug = newSlug;

      const existing = await DataModel.findOne({
        where: {
          [Op.or]: [{ value: value.trim() }],
        },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, `Value "${value}" already exists`, { existing_id: existing.id }, 409);
      }

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const attributeValue = await DataModel.create(req.body, { transaction });
      await transaction.commit();

      const createdData = await DataModel.findByPk(attributeValue.id, {
        include: [
          {
            model: models.ProductAttribute,
            as: "attribute",
            attributes: ["id", "name", "name_ar", "code"],
          },
        ],
      });

      sendSuccessResponse(res, createdData, "Attribute Value created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Attribute Value creation error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async show(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, {
        include: [
          {
            model: models.ProductAttribute,
            as: "attribute",
            attributes: ["id", "name", "name_ar", "code"],
          },
        ],
      });

      if (!data) return sendNotFoundError(res, "Attribute Value");

      sendSuccessResponse(res, data, "Attribute Value retrieved successfully");
    } catch (error) {
      console.error("Attribute Value show error:", error);
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
      const { value, attribute_id } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Attribute Value");
      }

      // Verify attribute exists if changing
      if (attribute_id && attribute_id !== data.attribute_id) {
        const attribute = await models.ProductAttribute.findByPk(attribute_id);
        if (!attribute) {
          await transaction.rollback();
          return sendNotFoundError(res, "Product Attribute");
        }
      }

      if (value && value.trim() !== data.value) {
        const newSlug = await AttributeValuesController.generateUniqueSlug(value, id);
        req.body.slug = newSlug;
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      await data.update(req.body, { transaction });
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id, {
        include: [
          {
            model: models.ProductAttribute,
            as: "attribute",
            attributes: ["id", "name", "name_ar", "code"],
          },
        ],
      });

      sendSuccessResponse(res, updatedData, "Attribute Value updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Attribute Value update error:", error);
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
      if (!data) return sendNotFoundError(res, "Attribute Value");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Attribute Value deleted successfully");
    } catch (error) {
      console.error("Attribute Value deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = AttributeValuesController;

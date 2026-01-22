const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productBaseRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");
const { Op } = require("sequelize");
const { upateVariantsPrices, updateVariantsPrices } = require("../../../traits/ProductVariantHelper");
const { RootNodesUnavailableError } = require("redis");

const DataModel = models.ProductBase;

class ProductBaseController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["title", "slug", "description"],
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          { association: "category", attributes: ["id", "name", "parent_id", "slug"] },
          { association: "sectors", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          {association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"]},
          {
            model: models.ProductVariants,
            as: "variants",
            include: [
              {
                model: models.ProductAttribute,
                as: "attributes",
                through: { attributes: [] },
              },
              {
                model: models.AttributeValues,
                as: "attribute_values",
                through: { attributes: [] },
              },
             
            ],
          },
          // {
          //   model: models.ProductProjectImage,
          //   as: "projectImages",
          //   attributes: ["id", "media_path", "media_alt", "media_alt_ar"],
          // }
        ],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product Base retrieved successfully");
    } catch (error) {
      console.error("Product Base index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { title } = req.body;

      if (!title || title.trim() === "") return sendErrorResponse(res, "Title is required to generate slug", null, 400);

      const newSlug = slugify(title.trim(), { lower: true, strict: true });

      const existing = await DataModel.findOne({
        where: { slug: newSlug },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, `Slug "${newSlug}" already exists`, { existing_id: existing.id }, 409);
      }

      req.body.slug = newSlug;

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const { selling_points, sectors, ...productBaseData } = req.body;

      const productBase = await DataModel.create(productBaseData, { transaction });

      // Associate selling points if provided
      if (selling_points) {
        const parsedPoints = JSON.parse(selling_points);
        parsedPoints?.length > 0 && (await productBase.setSellingPoints(parsedPoints, { transaction }));
      }

      // Associate sectors if provided
      if (sectors) {
        const parsedSectors = JSON.parse(sectors);
        parsedSectors?.length > 0 && (await productBase.setSectors(parsedSectors, { transaction }));
      }

      await transaction.commit();

      const createdData = await DataModel.findByPk(productBase.id, {
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug"] },
          { association: "sectors", attributes: ["id", "name", "slug"] },
        ],
      });

      sendSuccessResponse(res, createdData, "Product Base created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product Base creation error:", error);
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
          { association: "category", attributes: ["id", "name", "parent_id", "slug"] },
          { association: "sellingPoints", attributes: ["id", "name", "slug"] },
          { association: "sectors", attributes: ["id", "name", "slug"] },
        ],
      });

      if (!data) return sendNotFoundError(res, "Product Base");

      sendSuccessResponse(res, data, "Product Base retrieved successfully");
    } catch (error) {
      console.error("Product Base show error:", error);
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
      const { title, base_price_changed } = req.body;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Base");
      }

      if (title && title.trim() !== data.title) {
        const newSlug = slugify(title.trim(), { lower: true, strict: true });

        const existing = await DataModel.findOne({
          where: {
            slug: { [Op.iLike]: newSlug },
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });

        if (existing) {
          await transaction.rollback();
          return sendErrorResponse(res, `Slug "${newSlug}" already exists`, { existing_id: existing.id }, 409);
        }

        req.body.slug = newSlug;
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      const { selling_points, sectors, ...productBaseData } = req.body;

      await data.update(productBaseData, { transaction });

      // Update selling points if provided
      if (selling_points) {
        const parsedPoints = JSON.parse(selling_points);
        await data.setSellingPoints(parsedPoints, { transaction });
      }

      // Update sectors if provided
      if (sectors) {
        const parsedSectors = JSON.parse(sectors);
        await data.setSectors(parsedSectors, { transaction });
      }

      base_price_changed == 1 && (await updateVariantsPrices(transaction, id, req.body.base_price));

      await transaction.commit();

      const updatedData = await DataModel.findByPk(id, {
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug"] },
          { association: "sectors", attributes: ["id", "name", "slug"] },
        ],
      });

      sendSuccessResponse(res, updatedData, "Product Base updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Base update error:", error);
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
      if (!data) return sendNotFoundError(res, "Product Base");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Product Base deleted successfully");
    } catch (error) {
      console.error("Product Base deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductBaseController;

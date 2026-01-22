const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestUpdate, validateId } = require("../../../request/resources/ProductVariantImagesRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");

const DataModel = models.ProductVariantImages;

class ProductVariantImagesController {
  static async index(req, res) {
    try {
      const { variant_id } = req.query;
      const whereClause = {};
      if (variant_id) {
        whereClause.product_variant_id = variant_id;
      }

      const result = await paginate(DataModel, req, {
        where: whereClause,
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["name", "slug"],
        include: [
          {
            model: models.ProductVariants,
            as: "product_variant",
            attributes: ["id", "sku"],
          },
        ],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product Variant Images retrieved successfully");
    } catch (error) {
      console.error("Product Variant Images index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { product_variant_id } = req.body;

      console.log(req.files);

      const uploadedFiles = req.files?.images || [];

      if (!product_variant_id) {
        await transaction.rollback();
        return sendValidationError(res, [{ msg: "Product variant ID is required" }]);
      }

      if (uploadedFiles.length === 0) {
        await transaction.rollback();
        return sendValidationError(res, [{ msg: "At least one image is required" }]);
      }

      if (uploadedFiles.length > 10) {
        await transaction.rollback();
        return sendValidationError(res, [{ msg: "Maximum 10 images can be uploaded at once" }]);
      }

      // Parse metadata for each image from form-data
      // Expected format: sort_order[0], sort_order[1], status[0], status[1], media_type[0], is_primary[0], etc.
      const sortOrders = req.body.sort_order || [];
      const statuses = req.body.status || [];
      const mediaTypes = req.body.media_type || [];
      const isPrimaryFlags = req.body.is_primary || [];

      // Normalize to arrays if single values are passed
      const normalizeToArray = (value) => (Array.isArray(value) ? value : [value]);
      const sortOrderArr = normalizeToArray(sortOrders);
      const statusArr = normalizeToArray(statuses);
      const mediaTypeArr = normalizeToArray(mediaTypes);
      const isPrimaryArr = normalizeToArray(isPrimaryFlags);

      // Ensure only one image is marked as primary
      const primaryCount = isPrimaryArr.filter((val) => val === "true" || val === true).length;
      if (primaryCount > 1) {
        await transaction.rollback();
        return sendValidationError(res, [{ msg: "Only one image can be marked as primary" }]);
      }

      const imagesToCreate = uploadedFiles.map((file, index) => ({
        product_variant_id,
        media_path: file.path.replace(/\\/g, "/"),
        media_type: mediaTypeArr[index] || "image",
        sort_order: parseInt(sortOrderArr[index], 10) || index,
        status: statusArr[index] !== "false" && statusArr[index] !== false,
        is_primary: isPrimaryArr[index] === "true" || isPrimaryArr[index] === true,
      }));

      const createdImages = await DataModel.bulkCreate(imagesToCreate, { transaction });
      await transaction.commit();

      const createdIds = createdImages.map((img) => img.id);
      const createdData = await DataModel.findAll({
        where: { id: createdIds },
        order: [["sort_order", "ASC"]],
      });

      sendSuccessResponse(res, createdData, "Product Variant Images created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product Variant Images creation error:", error);
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

      if (!data) return sendNotFoundError(res, "Product Variant Image");

      sendSuccessResponse(res, data, "Product Variant Image retrieved successfully");
    } catch (error) {
      console.error("Product Variant Image show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all([...validateId, ...validationRequestUpdate].map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product Variant Image");
      }

      // Handle file upload if a new image is provided
      if (req.files?.images?.[0]) {
        const newFile = req.files.images[0];
        req.body.media_path = newFile.path.replace(/\\/g, "/");
      }

      // Parse boolean and integer fields from form-data
      if (req.body.sort_order !== undefined) {
        req.body.sort_order = parseInt(req.body.sort_order, 10);
      }
      if (req.body.status !== undefined) {
        req.body.status = req.body.status !== "false" && req.body.status !== false;
      }
      if (req.body.is_primary !== undefined) {
        req.body.is_primary = req.body.is_primary === "true" || req.body.is_primary === true;
      }

      await data.update(req.body, { transaction });
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id);

      sendSuccessResponse(res, updatedData, "Product Variant Image updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Variant Image update error:", error);
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
      if (!data) return sendNotFoundError(res, "Product Variant Image");

      await data.destroy();
      sendSuccessResponse(res, { id }, "Product Variant Image deleted successfully");
    } catch (error) {
      console.error("Product Variant Image deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductVariantImagesController;

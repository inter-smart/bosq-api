const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productModelsRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");
const { default: slugify } = require("slugify");
const { updateVariantsPrices } = require("../../../traits/ProductVariantHelper");

const DataModel = models.ProductModels;

class ProductModelsController {
  static async generateUniqueSlug(title, productId, ignoreId = null) {
    const baseSlug = slugify(title.trim(), { lower: true, strict: true });

    // Check for any slugs starting with the baseSlug
    const whereClause = {
      product_id: productId,
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
      const { product_id } = req.query;
      const whereClause = {};
      if (product_id) {
        whereClause.product_id = product_id;
      }

      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        where: whereClause,
        searchFields: ["title", "title_ar", "$product.title$"],
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
          {
            model: models.ProductBase,
            as: "product",
            attributes: ["id", "title", "slug"],
            required: false,
          },
        ],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(res, response, "Product models retrieved successfully");
    } catch (error) {
      console.error("Product models index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { product_id, title, code } = req.body;

      const product = await models.ProductBase.findByPk(product_id);
      if (!product) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product");
      }

      if (!title || title.trim() === "") return sendErrorResponse(res, "Title is required to generate slug", null, 400);

      // Check for existing title within the same product
      console.log(`Checking uniqueness for ProductID: ${product_id}, Title: ${title.trim()}`);
      const existingTitle = await DataModel.findOne({
        where: {
          product_id: product_id,
          title: title.trim(),
        },
        paranoid: true,
      });

      if (existingTitle) {
        console.log(`Found existing title for ProductID: ${existingTitle.product_id}, ID: ${existingTitle.id}`);
        await transaction.rollback();
        return sendErrorResponse(res, `Title "${title}" already exists for this product`, { existing_id: existingTitle.id }, 409);
      }

      // Check for existing code if provided within the same product
      if (code && code.trim() !== "") {
        const existingCode = await DataModel.findOne({
          where: {
            product_id: product_id,
            code: code.trim(),
          },
          paranoid: true,
        });
        if (existingCode) {
          await transaction.rollback();
          return sendErrorResponse(res, `Code "${code}" already exists for this product`, { existing_id: existingCode.id }, 409);
        }
      }

      const newSlug = await ProductModelsController.generateUniqueSlug(title, product_id);
      req.body.slug = newSlug;

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const productModel = await DataModel.create(req.body, {
        transaction,
      });
      await transaction.commit();
      const createdData = await DataModel.findByPk(productModel.id, {
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      sendSuccessResponse(res, createdData, "Product model created successfully", 201);
    } catch (error) {
      await transaction.rollback();
      console.error("Product model creation error:", error);
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
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      if (!data) return sendNotFoundError(res, "Product model");

      sendSuccessResponse(res, data, "Product model retrieved successfully");
    } catch (error) {
      console.error("Product model show error:", error);
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

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product model");
      }

      const { code, title, base_price_changed } = req.body;

      // Check for code uniqueness if changed
      if (code && code.trim() !== data.code) {
        const existingCode = await DataModel.findOne({
          where: {
            product_id: data.product_id,
            code: code.trim(),
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });
        if (existingCode) {
          await transaction.rollback();
          return sendErrorResponse(res, `Code "${code}" already exists for this product`, { existing_id: existingCode.id }, 409);
        }
      }

      // Check for title uniqueness and regenerate slug if changed
      if (title && title.trim() !== data.title) {
        console.log(`Checking uniqueness for ProductID: ${data.product_id}, Title (Update): ${title.trim()}`);
        const existingTitle = await DataModel.findOne({
          where: {
            product_id: data.product_id,
            title: title.trim(),
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });

        if (existingTitle) {
          console.log(`Found existing title during update for ProductID: ${existingTitle.product_id}, ID: ${existingTitle.id}`);
          await transaction.rollback();
          return sendErrorResponse(res, `Title "${title}" already exists for this product`, { existing_id: existingTitle.id }, 409);
        }

        const newSlug = await ProductModelsController.generateUniqueSlug(title, data.product_id, id);
        req.body.slug = newSlug;
      }

      const fileFields = ["media_path"];
      await handleFileUploadUpdate(req, data, fileFields);

      await data.update(req.body, { transaction });
      base_price_changed == 1 && (await updateVariantsPrices(transaction, id, req.body.base_price));
      await transaction.commit();

      const updatedData = await DataModel.findByPk(id, {
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      sendSuccessResponse(res, updatedData, "Product model updated successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product model update error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroyAll(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        await transaction.rollback();
        return sendValidationError(res, [{ msg: "IDs must be a non-empty array" }]);
      }

      // Permanently delete all variants under these models
      const variantsDeleted = await models.ProductVariants.destroy({
        where: { product_model_id: ids },
        force: true,
        transaction,
      });
      console.log(`ProductVariants deleted count: ${variantsDeleted}`);

      const modelsDeleted = await DataModel.destroy({
        where: { id: ids },
        force: true,
        transaction,
      });
      console.log(`ProductModels deleted count: ${modelsDeleted}`);

      await transaction.commit();

      sendSuccessResponse(res, { deleted_ids: ids }, "Product Models deleted successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product Model bulk deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async destroy(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Product model");
      }

      // Permanently delete all variants under this model
      await models.ProductVariants.destroy({
        where: { product_model_id: id },
        force: true,
        transaction,
      });

      await data.destroy({ transaction });
      await transaction.commit();

      sendSuccessResponse(res, { id }, "Product model deleted successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Product model deletion error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getByProductId(req, res) {
    await Promise.all(validateId.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    try {
      const { id } = req.params;

      const data = await DataModel.findAll({
        where: { product_id: id },
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        include: [
          {
            model: models.ProductVariants,
            as: "variants",
            required: false,
          },
        ],
      });

      sendSuccessResponse(res, data, "Product models retrieved successfully");
    } catch (error) {
      console.error("Product models by product error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductModelsController;

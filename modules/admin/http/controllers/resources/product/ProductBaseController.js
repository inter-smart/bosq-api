const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productBaseRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");
const { Op } = require("sequelize");

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

  static async storeDumy(req, res) {
    await Promise.all(validationRequestPost.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();

    try {
      const { title, base_price } = req.body;

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

      // Associate selling points
      if (selling_points) {
        const parsedPoints = JSON.parse(selling_points);
        parsedPoints?.length && (await productBase.setSellingPoints(parsedPoints, { transaction }));
      }

      // Associate sectors
      if (sectors) {
        const parsedSectors = JSON.parse(sectors);
        parsedSectors?.length && (await productBase.setSectors(parsedSectors, { transaction }));
      }

      // ======================================================
      // PRODUCT VARIANT + ATTRIBUTE (DUMMY AUTO-GENERATED)
      // ======================================================

      const basePrice = base_price || 1000;

      const attributeValueMap = {
        1: { name: "Red", price: 100 },
        2: { name: "Blue", price: 120 },
        6: { name: "M", price: 0 },
        4: { name: "L", price: 50 },
      };

      const variantCombinations = [
        [
          { attribute_id: 7, attribute_value_id: 1 }, // Color: Red
          { attribute_id: 8, attribute_value_id: 4 }, // Size: M
        ],
        [
          { attribute_id: 7, attribute_value_id: 2 }, // Color: Blue
          { attribute_id: 8, attribute_value_id: 6 }, // Size: L
        ],
      ];

      for (const combo of variantCombinations) {
        let totalPrice = basePrice;
        let skuParts = [];
        let codeParts = [];

        for (const attr of combo) {
          const meta = attributeValueMap[attr.attribute_value_id];
          totalPrice += meta.price;
          skuParts.push(meta.name.toUpperCase());
          codeParts.push(meta.name.substring(0, 3).toUpperCase());
        }

        const sku = `${productBase.slug}-${skuParts.join("-")}`;
        const productCode = `${productBase.slug.toUpperCase()}-${codeParts.join("")}`;

        const createdVariant = await models?.ProductVariants.create(
          {
            product_id: productBase.id,
            sku,
            product_code: productCode,
            price: totalPrice,
            stock: 10,
            status: true,
          },
          { transaction },
        );

        for (const attr of combo) {
          await models?.ProductVariantAttributes.create(
            {
              product_variant_id: createdVariant.id,
              attribute_id: attr.attribute_id,
              attribute_value_id: attr.attribute_value_id,
              price: attributeValueMap[attr.attribute_value_id].price,
            },
            { transaction },
          );
        }
      }

      // ======================================================

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
      const { title } = req.body;

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

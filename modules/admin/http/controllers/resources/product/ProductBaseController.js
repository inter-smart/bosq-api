const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../../../../../database/models");
const { validationRequestPost, validateId } = require("../../../request/resources/productBaseRequest");
const { paginate } = require("../../../traits/datatablePaginationHelper");
const { sendSuccessResponse, sendErrorResponse, sendValidationError, sendNotFoundError } = require("../../../traits/responseHandler");
const { validationResult } = require("express-validator");
const { handleFileUploadStore, handleFileUploadUpdate } = require("../../../middleware/multerMiddleware");
const { Op } = require("sequelize");
const { updateVariantsPrices } = require("../../../traits/ProductVariantHelper");

const DataModel = models.ProductBase;

class ProductBaseController {
  static async generateUniqueSlug(title, ignoreId = null) {
    const baseSlug = slugify(title.trim(), { lower: true, strict: true });

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
      const { status } = req.query;
      const where = {};

      if (status && status !== "all") {
        where.status = status === "active" || status === "true";
      }

      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["title", "slug", "description"],
        where,
        include: [
          { association: "sellingPoints", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          { association: "models", attributes: ["id", "code", "title", "slug"] },
          { association: "sectors", attributes: ["id", "name", "slug"], through: { attributes: [] } },
          { association: "projectImages", attributes: ["id", "media_path", "media_alt", "media_alt_ar"] },
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

      // Check for existing title
      const existing = await DataModel.findOne({
        where: { title: title.trim() },
        paranoid: true,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, `Title "${title}" already exists`, { existing_id: existing.id }, 409);
      }

      const newSlug = await ProductBaseController.generateUniqueSlug(title);
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
        const existingTitle = await DataModel.findOne({
          where: {
            title: title.trim(),
            id: { [Op.ne]: id },
          },
          paranoid: true,
        });

        if (existingTitle) {
          await transaction.rollback();
          return sendErrorResponse(res, `Title "${title}" already exists`, { existing_id: existingTitle.id }, 409);
        }

        const newSlug = await ProductBaseController.generateUniqueSlug(title, id);
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

  static async export(req, res) {
    try {
      const { status, startDate, endDate, search, keyword } = req.query;
      const searchTerm = search || keyword;
      const where = {};

      if (status && status !== "all") {
        where.status = status === "active" || status === "true";
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          where.createdAt[Op.gte] = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt[Op.lte] = end;
        }
      }

      if (searchTerm) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${searchTerm}%` } },
          { slug: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
        ];
      }

      const list = await DataModel.findAll({
        where,
        order: [["createdAt", "DESC"]],
      });

      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Base Products");

      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Title", key: "title", width: 30 },
        { header: "Slug", key: "slug", width: 30 },
        { header: "Status", key: "status", width: 15 },
        { header: "Sort Order", key: "sort_order", width: 15 },
        { header: "Created At", key: "createdAt", width: 25 },
      ];

      list.forEach((item) => {
        worksheet.addRow({
          id: item.id,
          title: item.title,
          slug: item.slug,
          status: item.status ? "Active" : "Inactive",
          sort_order: item.sort_order || 0,
          createdAt: item.createdAt,
        });
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=base-products.xlsx");

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Product Base export error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProductBaseController;

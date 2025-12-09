const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../../database/models/index.js");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../../traits/responseHandler.js");

const { Op, where, fn, col } = require("sequelize");

const {
  validationRequestPost,
  validateId,
} = require("../../../request/policy/returnPolicy/returnPoliciesRequest.js");
const {
  paginate,
} = require("../../../traits/datatablePaginationHelper.js");

const DataModel = models.ReturnPolicies;

class ReturnPoliciesController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["title"],
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
    validationRequestPost.map((validation) => validation.run(req))
  );
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidationError(res, errors.array());
  }

  const transaction = await sequelize.transaction();

  try {
    const { title, title_ar } = req.body;

    // Check English title (case-insensitive)
    const englishExists = await DataModel.findOne({
      where: where(
        fn("LOWER", fn("TRIM", col("title"))),
        fn("LOWER", fn("TRIM", title))
      ),
    });

    // Check Arabic title (case-insensitive)
    const arabicExists = await DataModel.findOne({
      where: where(
        fn("LOWER", fn("TRIM", col("title_ar"))),
        fn("LOWER", fn("TRIM", title_ar))
      ),
    });

    if (englishExists && arabicExists) {
      return sendErrorResponse(
        res,
        "Both English and Arabic titles already exist"
      );
    }

    if (englishExists) {
      return sendErrorResponse(
        res,
        `English title "${title}" already exists`
      );
    }

    if (arabicExists) {
      return sendErrorResponse(
        res,
        `Arabic title "${title_ar}" already exists`
      );
    }

    // Create data
    const data = await DataModel.create(req.body, { transaction });
    await transaction.commit();

    sendSuccessResponse(res, data, "Data created successfully", 201);

  } catch (error) {
    await transaction.rollback();
    console.error("Data creation error:", error);
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
      [...validateId, ...validationRequestPost].map((v) => v.run(req))
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { title, title_ar } = req.body;

      let englishExists = null;
      let arabicExists = null;

      // 🔍 Check English title duplicate (case-insensitive)
      englishExists = await DataModel.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.and]: [where(fn("LOWER", col("title")), fn("LOWER", title))],
        },
      });

      // 🔍 Check Arabic title duplicate (case-insensitive)
      arabicExists = await DataModel.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.and]: [
            where(fn("LOWER", col("title_ar")), fn("LOWER", title_ar)),
          ],
        },
      });

      // ⚠️ Separate Messages
      if (englishExists && arabicExists) {
        return sendErrorResponse(
          res,
          "Both English and Arabic titles already exist"
        );
      }

      if (englishExists) {
        return sendErrorResponse(
          res,
          `English title "${title}" already exists`
        );
      }

      if (arabicExists) {
        return sendErrorResponse(
          res,
          `Arabic title "${title_ar}" already exists`
        );
      }

      // Continue...

      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Data");
      }

      await data.update(req.body, { transaction });

      await transaction.commit();

      const updatedData = await DataModel.findByPk(data.id);

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

      // Soft delete
      await data.destroy();

      sendSuccessResponse(res, { id }, "Data deleted successfully");
    } catch (error) {
      console.error("Data deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ReturnPoliciesController;

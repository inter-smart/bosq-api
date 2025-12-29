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

const DataModel = models.ProjectCategories;

class ProjectCategoriesController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["name", "name_ar"],
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
      validationProjectCategories.map((validation) => validation.run(req))
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { name } = req.body;

      const isExist = await DataModel.findOne({
        where: {
          name: {
            [Op.iLike]: req.body.name,
          },
        },
      });

      if (isExist) {
        return sendErrorResponse(res, `${name} already exists`);
      }

      // Create data with transaction
      const data = await DataModel.create(req.body, { transaction });

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
      [...validateId, ...validationProjectCategories].map((v) => v.run(req))
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { name } = req.body;

      const isExist = await DataModel.findOne({
        where: {
          name: {
            [Op.iLike]: req.body.name,
          },
          id: { [sequelize.Sequelize.Op.ne]: id },
        },
      });

      if (isExist) {
        await transaction.rollback();
        return sendErrorResponse(res, `${name} already exists`);
      }

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

module.exports = ProjectCategoriesController;

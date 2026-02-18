const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler");
const { paginate } = require("../../traits/datatablePaginationHelper");
const {
  validateEnquiryDropdown,
  validateId,
} = require("../../request/master/enquiryDropdownRequest");
const cacheKeys = require("../../../../redis/cacheKeys");
const { invalidateCache } = require("../../../../redis/redisService");

const DataModel = models.EnquiryDropdown;

const homeCacheKey = cacheKeys.home;
const customizationCacheKey = cacheKeys.customization;

class EnquiryDropdownController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["sort_order", "ASC"],
          ["createdAt", "DESC"],
        ],
        searchFields: ["title", "title_ar"],
      });

      const response = {
        list: result.data,
        pagination: result.pagination,
      };

      sendSuccessResponse(
        res,
        response,
        "Enquiry dropdown items retrieved successfully",
      );
    } catch (error) {
      console.error("EnquiryDropdown index error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async store(req, res) {
    await Promise.all(validateEnquiryDropdown.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();
    try {
      const data = await DataModel.create(req.body, { transaction });
      await invalidateCache(homeCacheKey);
      await invalidateCache(customizationCacheKey);
      await transaction.commit();

      sendSuccessResponse(
        res,
        data,
        "Enquiry dropdown item created successfully",
        201,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("EnquiryDropdown creation error:", error);
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
      if (!data) return sendNotFoundError(res, "Enquiry Dropdown item");
      sendSuccessResponse(
        res,
        data,
        "Enquiry dropdown item retrieved successfully",
      );
    } catch (error) {
      console.error("EnquiryDropdown show error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async update(req, res) {
    await Promise.all(
      [...validateId, ...validateEnquiryDropdown].map((v) => v.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationError(res, errors.array());

    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const data = await DataModel.findByPk(id, { transaction });
      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Enquiry Dropdown item");
      }

      await data.update(req.body, { transaction });
      await invalidateCache(homeCacheKey);
      await invalidateCache(customizationCacheKey);
      await transaction.commit();

      sendSuccessResponse(
        res,
        data,
        "Enquiry dropdown item updated successfully",
      );
    } catch (error) {
      await transaction.rollback();
      console.error("EnquiryDropdown update error:", error);
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
        return sendNotFoundError(res, "Enquiry Dropdown item");
      }

      await data.destroy({ transaction });
      await invalidateCache(homeCacheKey);
      await invalidateCache(customizationCacheKey);
      await transaction.commit();

      sendSuccessResponse(
        res,
        { id },
        "Enquiry dropdown item deleted successfully",
      );
    } catch (error) {
      await transaction.rollback();
      console.error("EnquiryDropdown deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = EnquiryDropdownController;

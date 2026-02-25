const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models/index.js");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler.js");

const { Op } = require("sequelize");

const {
  validateLeadGenerationCreate,
  validateId,
} = require("../../request/enquiry/leadGenerationRequest.js");
const {
  paginate,
} = require("../../traits/datatablePaginationHelper.js");

const DataModel = models.ContactEnquiry;
const LEAD_TYPE = "lead-generation";

class LeadGenerationController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        where: {
          type: LEAD_TYPE,
        },
        order: [["createdAt", "DESC"]],
        searchFields: ["name", "email"],
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

  static async show(req, res) {
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id } = req.params;

      const data = await DataModel.findOne({
        where: {
          id,
          type: LEAD_TYPE,
        },
      });

      if (!data) {
        return sendNotFoundError(res, "Lead");
      }

      sendSuccessResponse(res, data, "Lead retrieved successfully");
    } catch (error) {
      console.error("Data show error:", error);
      sendErrorResponse(res, error);
    }
  }


  static async destroy(req, res) {
    await Promise.all(validateId.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    try {
      const { id } = req.params;

      const data = await DataModel.findOne({
        where: {
          id,
          type: LEAD_TYPE,
        },
      });

      if (!data) {
        return sendNotFoundError(res, "Lead");
      }

      await data.destroy();
      sendSuccessResponse(res, { id }, "Lead deleted successfully");
    } catch (error) {
      console.error("Data deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = LeadGenerationController;

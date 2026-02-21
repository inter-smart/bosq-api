const { validationResult } = require("express-validator");
const { models } = require("../../../../../database/models/index.js");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundError,
} = require("../../traits/responseHandler.js");

const {
  validateId,
} = require("../../request/enquiry/projectEnquiriesRequest.js");
const {
  paginate,
} = require("../../traits/datatablePaginationHelper.js");

const DataModel = models.ProjectEnquiry;

class ProjectEnquiryController {
  static async index(req, res) {
    try {
      const result = await paginate(DataModel, req, {
        order: [
          ["createdAt", "DESC"],
        ],
        include: [
          {
            model: models.Projects,
            as: "project",
            attributes: ["id", "title", "slug"],
          },
        ],
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

      const data = await DataModel.findByPk(id, {
        include: [
          {
            model: models.Projects,
            as: "project",
            attributes: ["id", "title", "slug"],
          },
        ],
      });

      if (!data) {
        return sendNotFoundError(res, "Data");
      }

      sendSuccessResponse(res, data, "Data retrieved successfully");
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

      const data = await DataModel.findByPk(id);
      if (!data) {
        return sendNotFoundError(res, "Data");
      }

      await data.destroy();
      sendSuccessResponse(res, { id }, "Data deleted successfully");
    } catch (error) {
      console.error("Data deletion error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = ProjectEnquiryController;

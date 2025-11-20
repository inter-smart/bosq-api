const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/PolicyService");

class PolicyController {
  static async index(req, res) {
    try {
      const { slug } = req.params;

      if (!slug) {
        return ApiResponse.error(res, {
          message: "Slug is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const data = await service.index(slug);

      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(
        error,
        res,
        "PolicyController.index"
      );
    }
  }
}

module.exports = PolicyController;

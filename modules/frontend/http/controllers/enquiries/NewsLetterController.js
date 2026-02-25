const service = require("../../services/NewsLetterService.js");
const {
  sendErrorResponse,
  sendSuccessResponse,
} = require("../../../../admin/http/traits/responseHandler.js");
const { ApiResponse } = require("../../traits/response.js");

class NewsLetterController {
  static async store(req, res) {
    try {
      const { data, message } = await service.store(req.body);
return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.SUBSCRIPTION_SUCCESSFUL,
        data: data,
        status: HTTP_STATUS.CREATED,
      });    } catch (error) {
      return ApiResponse.error(res, {
        message: error.message || "Internal Server Error",
        status: error.statusCode || 500,
      });
    }
  }
}

module.exports = NewsLetterController;

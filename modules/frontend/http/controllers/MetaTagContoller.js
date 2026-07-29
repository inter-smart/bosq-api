const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/MetaTagService");
const { sendSuccessResponse, sendErrorResponse } = require("../../../admin/http/traits/responseHandler");

class MetaTagController {
  static async index(req, res) {
    try {
      const { page } = req.params;

      const language = req.headers["accept-language"] || "en";

      const { data, message } = await service.index(page, language);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async getProductMetaBySlug(req, res) {
    const params = req.query;
    const language = req.headers["accept-language"] || "en";

    try {
      const { data, message } = await service.getMetaForProduct(params, language);

      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = MetaTagController;

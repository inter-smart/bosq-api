const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/MetaTagService");

class MetaTagController {
  static async index(req, res) {
    try {
      const { slug, type } = req.params;

      if (!slug || !type) {
        return ApiResponse.error(res, {
          message: "Type and slug are required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const data = await service.index(type, slug);

      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(
        error,
        res,
        "MetaTagController.index"
      );
    }
  }
}

module.exports = MetaTagController;

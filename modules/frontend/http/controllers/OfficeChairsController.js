const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/OfficeChairsService.js");

class OfficeChairsController {
  static async index(req, res) {
    try {
      const data = await service.getData(req);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(
        error,
        res,
        "OfficeChairsController.index"
      );
    }
  }
}

module.exports = OfficeChairsController;

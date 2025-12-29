const { sendSuccessResponse, sendErrorResponse } = require("../../../admin/http/traits/responseHandler");
const service = require("../services/FaqService.js");

class FaqController {
  static async index(req, res) {
    try {
      const { data, message } = await service.getData();
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = FaqController;

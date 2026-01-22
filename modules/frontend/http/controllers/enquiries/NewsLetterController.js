const service = require("../../services/NewsLetterService.js");
const { sendErrorResponse, sendSuccessResponse } = require("../../../../admin/http/traits/responseHandler.js");

class NewsLetterController {
  static async store(req, res) {
    try {
      const {data, message} = await service.store(req.body);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = NewsLetterController;

const { sendSuccessResponse, sendErrorResponse } = require("../../../admin/http/traits/responseHandler.js");
const service = require("../services/TermsAndConditions.js");

class TermsAndConditionsController {
  static async index(req, res) {
    try {
      const { data, message } = await service.getData(req, res);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}


module.exports = TermsAndConditionsController;

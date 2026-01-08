const { sendSuccessResponse, sendErrorResponse } = require("../../../admin/http/traits/responseHandler");
const service = require("../services/privacyPolicy");

class PolicyController {
  static async index(req, res) {
    try {
      const { data, message } = await service.getData();
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}


module.exports = PolicyController;

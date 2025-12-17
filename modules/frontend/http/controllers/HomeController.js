const { sendErrorResponse, sendSuccessResponse } = require("../../../admin/http/traits/responseHandler");
const service = require("../services/HomeService");

class HomeController {
  static async index(req, res) {
    try {
      const data = await service.getData();
      return sendSuccessResponse(res, data, "Data fetched  successfully", 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = HomeController;

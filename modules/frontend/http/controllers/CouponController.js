const { sendErrorResponse, sendSuccessResponse } = require("../../../admin/http/traits/responseHandler");
const service = require("../services/CouponService.js");

class CouponsController {
  static async index(req, res) {
    try {
      const { data, message } = await service.getData();
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = CouponsController;

const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS } = require("../../traits/constants");
const service = require("../../services/ProductEnquiryService.js");

class ProductEnquiryController {
  static async store(req, res) {
    try {
      const result = await service.store(req,res);
      return ApiResponse.success(res, {
        message: "Product enquiry submitted successfully",
        data: result,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ApiResponse.error(res, {
        message: error.message || "Internal Server Error",
        status: error.statusCode || 500,
      });
    }
  }
}

module.exports = ProductEnquiryController;

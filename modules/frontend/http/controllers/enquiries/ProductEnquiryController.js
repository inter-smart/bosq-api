const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../../traits/constants");
const service = require("../../services/ProductEnquiryService.js");
const { ErrorHandler } = require("../../traits/errorHandler.js");

class ProductEnquiryController {
  static async store(req, res) {
    try {
      const result = await service.store(req,res);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.PRODUCT_ENQUIRY_RECEIVED,
        data: result,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "ProductEnquiryController.store");

    }
  }
}

module.exports = ProductEnquiryController;

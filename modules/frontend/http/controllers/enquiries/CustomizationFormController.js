const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../../traits/constants");
const service = require("../../services/CustomizationEnquiryService.js");
const { ErrorHandler } = require("../../traits/errorHandler.js");
const {
  sendErrorResponse,
} = require("../../../../admin/http/traits/responseHandler.js");

class CustomizationEnquiryController {
  static async store(req, res) {
    try {
      const data = await service.store(req.body);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.ENQUIRY_RECEIVED,
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CustomizationFormController.store");
    }
  }

}

module.exports = CustomizationEnquiryController;

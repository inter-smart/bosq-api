const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../../traits/constants");
const service = require("../../services/ContactEnquiryService.js");
const { ErrorHandler } = require("../../traits/errorHandler.js");

class ContactEnquiryController {
  static async store(req, res) {
    try {
      const data = await service.store(req.body);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.ENQUIRY_RECEIVED,
        data,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "ContactEnquiryController.store");
    }
  }
}

module.exports = ContactEnquiryController;

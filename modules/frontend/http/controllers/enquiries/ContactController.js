const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../../traits/constants");
const service = require("../../services/ContactEnquiryService.js");

class ContactEnquiryController {
  static async store(req, res) {
    try {
      const result = await service.store(req.body);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.ENQUIRY_RECEIVED,
        data: result,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ApiResponse.error(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = ContactEnquiryController;

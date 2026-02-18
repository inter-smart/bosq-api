const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS } = require("../../traits/constants");
const service = require("../../services/ContactEnquiryService.js");

class ContactEnquiryController {
  static async store(req, res) {
    try {
      const result = await service.store(req.body);
      return ApiResponse.success(res, {
        message:
          req.body.type === "contact"
            ? "Contact enquiry submitted successfully"
            : "Lead generation enquiry submitted successfully",
        data: result,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ApiResponse.error(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = ContactEnquiryController;

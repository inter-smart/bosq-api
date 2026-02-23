const { ApiResponse } = require("../../traits/response");
const { HTTP_STATUS } = require("../../traits/constants");
const service = require("../../services/ProjectEnquiryService.js");
const { ErrorHandler } = require("../../traits/errorHandler.js");

class ProjectEnquiryController {
  static async store(req, res) {
    try {
      const data = await service.store(req.body);
      return ApiResponse.success(res, {
        message: "Project enquiry submitted successfully",
        data,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "ProjectEnquiryController.store");
    }
  }
}

module.exports = ProjectEnquiryController;

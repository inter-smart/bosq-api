const { sendErrorResponse, sendSuccessResponse } = require("../../../admin/http/traits/responseHandler");
const service = require("../services/BlogService");

class BlogController {
  static async index(req, res) {
    try {
      const { data, message } = await service.getData();
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async getBlogs(req, res) {
    try {
      const { data, message } = await service.getBlogs(req);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  // slug page
  static async show(req, res) {
    try {
      const { data, message } = await service.show(req.query.slug);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = BlogController;

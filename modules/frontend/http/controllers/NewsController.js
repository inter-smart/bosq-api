const { sendErrorResponse, sendSuccessResponse } = require("../../../admin/http/traits/responseHandler");
const service = require("../services/NewsService");

class NewsController {


  static async index(req, res) {
    try {
      const { data, message } = await service.getData();
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async getNews(req, res) {
    try {
      const { data, message } = await service.getNews(req);
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

  static async incrementView(req, res) {
    try {
      await service.incrementView(req.query.slug);
      return sendSuccessResponse(res, null, "View count updated", 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = NewsController;

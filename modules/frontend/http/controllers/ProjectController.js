const { sendSuccessResponse, sendErrorResponse } = require("../../../admin/http/traits/responseHandler");
const service = require("../services/ProjectService.js");

class ProjectController {
  static async index(req, res) {
    try {
      const { data, message } = await service.index();
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  // getProjectsBySlug
  static async getProjectsBySlug(req, res) {
    try {
      const { data, message } = await service.getProjectBySlug(req, res);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

//   slug
  static async show(req, res) {
    try {
      const { data, message } = await service.show(req,res);
      return sendSuccessResponse(res, data, message, 200);
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  
}


module.exports = ProjectController;

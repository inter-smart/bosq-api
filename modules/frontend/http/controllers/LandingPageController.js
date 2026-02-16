
const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/LandingPageService.js");
class LandingPageController {

    static async index(req, res) {
        try {
            const data = await service.getData(req,res);
            return ApiResponse.success(res, {
                message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
                data,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "LandingPageController.index");
        }
    }
}

module.exports = LandingPageController;
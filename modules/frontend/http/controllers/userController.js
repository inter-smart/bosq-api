
const { ApiResponse } = require("../traits/response");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants");
const { ErrorHandler } = require("../traits/errorHandler");
const service = require("../services/usersServices");
class UserController {

    static async getProfileData(req, res) {
        try {
            const data = await service.getProfileData(req,res);
            return ApiResponse.success(res, {
                message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
                data,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "homeController");
        }
    }

    static async editProfile(req, res) {
        try {
            const data = await service.editProfile(req,res);
            return ApiResponse.success(res, {
                message: RESPONSE_MESSAGES.SUCCESS.DATA_RETRIEVED,
                data,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "homeController");
        }
    }
}

module.exports = UserController;
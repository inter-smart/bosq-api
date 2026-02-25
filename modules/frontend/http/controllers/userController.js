
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

    // fetch profileDatabyid
       static async fetchProfileById(req, res) {
        try {
            const data = await service.fetchProfileById(req,res);
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
                message: RESPONSE_MESSAGES.SUCCESS.PROFILE_UPDATED,
                data,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "homeController");
        }
    }

    // change password

    static async changePassword(req, res) {
        try {
            await service.changePassword(req,res);
            return ApiResponse.success(res, {
                message: RESPONSE_MESSAGES.SUCCESS.PASSWORD_CHANGED,
                data: null,
                status: HTTP_STATUS.OK,
            });
        } catch (error) {
            return ErrorHandler.handleControllerError(error, res, "homeController");
        }
    }


  static async logout(req, res) {
    try {
      await service.logout(req, res);
      return ApiResponse.success(res, {
        message: RESPONSE_MESSAGES.SUCCESS.LOGOUT_SUCCESSFUL,
        data: null,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "userController");
    }
  }

}

module.exports = UserController;
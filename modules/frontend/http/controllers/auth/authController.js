const { ApiResponse } = require("../../traits/response.js");
const { RESPONSE_MESSAGES, HTTP_STATUS } = require("../../traits/constants.js");
const { ErrorHandler } = require("../../traits/errorHandler.js");
const service = require("../../services/auth/authService.js");

class UsersController {
  static async register(req, res) {
    try {
      const result = await service.register(req);
      if (result) {
        return ApiResponse.success(res, {
          message: result.message,
          data: result.data,
          status: result.status || HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.register");
    }
  }

  static async verifyOtp(req, res) {
    try {
      const result = await service.verifyOtp(req);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.OTP_VERIFIED,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.verifyOtp");
    }
  }

  static async createPassword(req, res) {
    try {
      const result = await service.createPassword(req);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.ACCOUNT_CREATED,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.createPassword");
    }
  }

  static async login(req, res) {
    try {
      const result = await service.login(req, res);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.LOGIN_SUCCESSFUL,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.login");
    }
  }

  static async forgotPassword(req, res) {
    try {
      const result = await service.forgotPassword(req);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.FORGOT_PASSWORD_OTP_SENT,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.forgotPassword");
    }
  }

  static async verifyForgotPasswordOtp(req, res) {
    try {
      const result = await service.verifyForgotPasswordOtp(req);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.RESET_PASSWORD_OTP_VERIFIED,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.verifyForgotPasswordOtp");
    }
  }

  static async createNewPassword(req, res) {
    try {
      const result = await service.createNewPassword(req);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.createNewPassword");
    }
  }

  static async googleLogin(req, res) {
    try {
      const result = await service.googleLogin(req, res);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.GOOGLE_LOGIN_SUCCESSFUL,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.googleLogin");
    }
  }

  static async refreshToken(req, res) {
    try {
      const result = await service.refreshToken(req, res);
      if (result) {
        return ApiResponse.success(res, {
          message: RESPONSE_MESSAGES.SUCCESS.LOGIN_SUCCESSFUL,
          data: result.data,
          status: HTTP_STATUS.OK,
        });
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "UsersController.refreshToken");
    }
  }
}

module.exports = UsersController;
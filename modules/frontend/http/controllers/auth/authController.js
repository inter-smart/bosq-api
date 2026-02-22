const { sendErrorResponse, sendSuccessResponse } = require("../../../../admin/http/traits/responseHandler.js");
const service = require("../../services/auth/authService.js");

class UsersController {
  static async register(req, res) {
    try {
      const result = await service.register(req, res);
      if (result) {
        return sendSuccessResponse(res, result.data, result.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async verifyOtp(req, res) {
    try {
      const result = await service.verifyOtp(req, res);
      if (result) {
        return sendSuccessResponse(res, result.data, result.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async createPassword(req, res) {
    try {
      const result = await service.createPassword(req, res);
      if (result) {
        return sendSuccessResponse(res, result.data, result.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  //   login
  static async login(req, res) {
    try {
      const result = await service.login(req, res);
      if (result) {
        return sendSuccessResponse(res, result?.data, result?.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const result = await service.forgotPassword(req, res);
      if (result) {
        return sendSuccessResponse(res, result.data, result.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async verifyForgotPasswordOtp(req, res) {
    try {
      const result = await service.verifyForgotPasswordOtp(req, res);
      if (result) {
        return sendSuccessResponse(res, result.data, result.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async createNewPassword(req, res) {
    try {
      const result = await service.createNewPassword(req, res);
      if (result) {
        return sendSuccessResponse(res, result.data, result.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }

  static async googleLogin(req, res) {
    try {
      const result = await service.googleLogin(req, res);
      if (result) {
        return sendSuccessResponse(res, result?.data, result?.message, 200);
      }
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = UsersController;

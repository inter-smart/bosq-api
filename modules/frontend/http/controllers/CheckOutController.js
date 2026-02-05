const { validationResult } = require("express-validator");
const { ApiResponse } = require("../traits/response.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants.js");
const { addToCartRequest, updateCartItemRequest, removeCartItemRequest } = require("../request/cartRequest.js");
const CheckOutService = require("../services/CheckOutService.js");

class CheckOutController {
  static async getCartData(req, res) {
    try {
      const userId = req.auth?.id;
      const sessionId = req.cartOwner?.id;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User ID or Session ID is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CheckOutService.getCartData(userId, sessionId);

      return ApiResponse.success(res, {
        message: "Cart data retrieved successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CheckOutController.getCartData");
    }
  }
}

module.exports = CheckOutController;

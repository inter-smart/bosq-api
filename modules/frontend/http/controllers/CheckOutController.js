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

  static async getBuyNowCartData(req, res) {
    try {
      const userId = req.auth?.id;
      const sessionId = req.cartOwner?.id;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User ID or Session ID is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CheckOutService.getBuyNowCartData(userId, sessionId);

      return ApiResponse.success(res, {
        message: "Buy now cart data retrieved successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CheckOutController.getBuyNowCartData");
    }
  }

  static async validateCheckout(req, res) {
    try {
      const cartOwner = req.cartOwner;

      if (!cartOwner) {
        return ApiResponse.error(res, {
          message: "User ID or Session ID is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CheckOutService.validateCheckout(cartOwner);

      return ApiResponse.success(res, {
        message: "Cart data retrieved successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CheckOutController.validateCheckout");
    }
  }

  static async getAddressForUsers(req, res) {
    const cartOwner = req.cartOwner;

    try {
      if (!cartOwner) {
        return ApiResponse.error(res, {
          message: "User ID or Session ID is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const address = await CheckOutService.getAllAddressByUser(cartOwner);

      return ApiResponse.success(res, {
        message: "Cart data retrieved successfully",
        data: address,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CheckOutController.getCartData");
    }
  }
  static async applyCoupon(req, res) {
    try {
      const coupon_code = req.body?.coupon_code;
      const type = req.body?.type || "cart";

      const { id: userId } = req.auth;

      if (!userId) {
        return ApiResponse.error(res, {
          message: "User ID or Session ID is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      if (!coupon_code) {
        return ApiResponse.error(res, {
          message: "Coupon code is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const result = await CheckOutService.applyCoupon(userId, coupon_code.trim().toUpperCase(), type);

      return ApiResponse.success(res, {
        message: "Coupon applied successfully",
        data: result,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CheckOutController.applyCoupon");
    }
  }

  static async removeCoupon(req, res) {
    try {
      const userId = req.auth?.id;
      const sessionId = req.cartOwner?.id;
      const type = req.body?.type || "cart";

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User ID or Session ID is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const result = await CheckOutService.removeCoupon(userId, sessionId, type);

      return ApiResponse.success(res, {
        message: "Coupon removed successfully",
        data: result,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CheckOutController.removeCoupon");
    }
  }
}

module.exports = CheckOutController;

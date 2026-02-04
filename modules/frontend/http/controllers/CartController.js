const { validationResult } = require("express-validator");
const CartService = require("../services/cartService.js");
const { ApiResponse } = require("../traits/response.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants.js");
const { addToCartRequest, updateCartItemRequest, removeCartItemRequest } = require("../request/cartRequest.js");

class CartController {
  /**
   * Get cart contents
   * GET /api/frontend/cart
   */
  static async getCart(req, res) {
    try {
      const userId = req.auth?.id || null;
      const sessionId = req?.query?.session_id || req?.body?.session_id || null;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User ID or Session ID is required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CartService.getCart(userId, sessionId);

      return ApiResponse.success(res, {
        message: "Cart retrieved successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.getCart");
    }
  }

  /**
   * Add item to cart
   * POST /api/frontend/cart/add
   */
  static async addItem(req, res) {
    try {
      const userId = req.auth?.id || null;
      const { variant_id, quantity = 1, session_id } = req.body;

      if (!userId && !session_id) {
        return ApiResponse.error(res, {
          message: "User must be logged in or provide a session ID",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CartService.addItem(userId, session_id, variant_id, quantity);

      return ApiResponse.success(res, {
        message: "Item added to cart successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.addItem");
    }
  }

  /**
   * Update cart item quantity
   * PUT /api/frontend/cart/item/:itemId
   */
  static async updateItem(req, res) {
    try {
      // Validate request
      await Promise.all(updateCartItemRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const userId = req.auth?.id || null;
      const { itemId } = req.params;
      const { quantity, variant_id, session_id } = req.body;

      if (!userId && !session_id) {
        return ApiResponse.error(res, {
          message: "User must be logged in or provide a session ID",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CartService.updateItemQuantity(userId, session_id, parseInt(itemId), parseInt(variant_id), quantity);

      return ApiResponse.success(res, {
        message: "Cart item updated successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.updateItem");
    }
  }

  /**
   * Remove item from cart
   * DELETE /api/frontend/cart/item/:itemId
   */
  static async removeItem(req, res) {
    try {
      // Validate request
      await Promise.all(removeCartItemRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const userId = req.auth?.id || null;
      const { itemId } = req.params;
      const sessionId = req.query?.session_id || req.body?.session_id || null;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or provide a session ID",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CartService.removeItem(userId, sessionId, parseInt(itemId));

      return ApiResponse.success(res, {
        message: "Item removed from cart successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.removeItem");
    }
  }

  /**
   * Clear all items from cart
   * DELETE /api/frontend/cart/clear
   */
  static async clearCart(req, res) {
    try {
      const userId = req.auth?.id || null;
      const sessionId = req.query.session_id || req.body.session_id || null;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or provide a session ID",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CartService.clearCart(userId, sessionId);

      return ApiResponse.success(res, {
        message: "Cart cleared successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.clearCart");
    }
  }

  /**
   * Merge guest cart into user cart (call after login)
   * POST /api/frontend/cart/merge
   */
  static async mergeCart(req, res) {
    try {
      const userId = req.auth?.id;
      const { session_id } = req.body;

      if (!userId) {
        return ApiResponse.error(res, {
          message: "User must be logged in to merge cart",
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }

      if (!session_id) {
        return ApiResponse.error(res, {
          message: "Session ID is required to merge cart",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      await CartService.mergeGuestCart(userId, session_id);
      const cart = await CartService.getCart(userId, null);

      return ApiResponse.success(res, {
        message: "Cart merged successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.mergeCart");
    }
  }
}

module.exports = CartController;

const { validationResult } = require("express-validator");
const crypto = require("crypto");
const CartService = require("../services/cartService.js");
const { ApiResponse } = require("../traits/response.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, RESPONSE_MESSAGES } = require("../traits/constants.js");
const { addToCartRequest, updateCartItemRequest, removeCartItemRequest } = require("../request/cartRequest.js");
const { console } = require("inspector");

const { COOKIE } = require("../../../../config/authConfig.js");

const GUEST_SESSION_COOKIE = "guest_cart_session";

const isProduction = process.env.NODE_ENV === "production";

class CartController {
  /**
   * Get session ID from cookie
   */
  static getSessionId(req) {
    return req.cookies?.[GUEST_SESSION_COOKIE] || null;
  }

  /**
   * Generate a new session ID and set cookie
   */
  static generateAndSetSessionCookie(res) {
    const sessionId = crypto.randomUUID();
    res.cookie(GUEST_SESSION_COOKIE, sessionId, {
      maxAge: COOKIE.GUEST_SESSION_MAX_AGE,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
    return sessionId;
  }

  /**
   * Get cart contents
   * GET /api/frontend/cart
   */
  static async getCart(req, res) {
    try {
      const userId = req.auth?.id || null;
      const sessionId = CartController.getSessionId(req);

      console.log(userId);
      console.log(sessionId);

      if (!userId && !sessionId) {
        return ApiResponse.success(res, {
          message: "Cart retrieved successfully",
          data: {
            items: [],
            subtotal: "0.00",
            discount_total: "0.00",
            tax_total: "0.00",
            grand_total: "0.00",
            item_count: 0,
          },
          status: HTTP_STATUS.OK,
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
      const { variant_id, quantity = 1 } = req.body;

      let sessionId = null;

      // For guest users, use cookie-based session
      if (!userId) {
        sessionId = CartController.getSessionId(req);
        // Generate new session if doesn't exist
        if (!sessionId) {
          sessionId = CartController.generateAndSetSessionCookie(res);
        }
      }

      const cart = await CartService.addItem(userId, sessionId, variant_id, quantity);

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
   * Add multiple items to cart (qty 1 each) — Frequently Bought Together
   * POST /api/frontend/cart/add-together
   * Body: { variant_ids: number[] }
   */
  static async addMultipleItems(req, res) {
    try {
      const userId = req.auth?.id || null;
      const { variant_ids } = req.body;

      if (!Array.isArray(variant_ids) || variant_ids.length === 0) {
        return ApiResponse.error(res, {
          message: "variant_ids must be a non-empty array",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      let sessionId = null;

      if (!userId) {
        sessionId = CartController.getSessionId(req);
        if (!sessionId) {
          sessionId = CartController.generateAndSetSessionCookie(res);
        }
      }

      await CartService.addMultipleItems(userId, sessionId, variant_ids);

      return ApiResponse.success(res, {
        message: "Items added to cart successfully",
        data: null,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.addMultipleItems");
    }
  }

  /**
   * Add item to cart
   * POST /api/frontend/cart/buynow
   */
  static async buyNowItem(req, res) {
    try {
      const userId = req.auth?.id || null;
      const { variant_id, quantity = 1 } = req.body;

      let sessionId = null;

      // For guest users, use cookie-based session
      if (!userId) {
        sessionId = CartController.getSessionId(req);
        // Generate new session if doesn't exist
        if (!sessionId) {
          sessionId = CartController.generateAndSetSessionCookie(res);
        }
      }

      const cart = await CartService.buyNowItem(userId, sessionId, variant_id, quantity);

      return ApiResponse.success(res, {
        message: "Item added to cart successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.buyNowItem");
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
      const { quantity, variant_id } = req.body;
      const sessionId = CartController.getSessionId(req);

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or have an active cart session",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await CartService.updateItemQuantity(userId, sessionId, parseInt(itemId), parseInt(variant_id), quantity);

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
      const sessionId = CartController.getSessionId(req);

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or have an active cart session",
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
      const sessionId = CartController.getSessionId(req);

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or have an active cart session",
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
   * Get matching products based on the most repeated category in the cart
   * GET /api/frontend/cart/matching-products
   */
  static async getMatchingProducts(req, res) {
    try {
      const userId = req.auth?.id || null;
      const sessionId = CartController.getSessionId(req);

      const data = await CartService.getMatchingProducts(userId, sessionId);

      return ApiResponse.success(res, {
        message: "Matching products fetched successfully",
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.getMatchingProducts");
    }
  }

  /**
   * Get similar products based on the dominant model in the cart
   * GET /api/frontend/cart/similar-products
   */
  static async getSimilarFromCart(req, res) {
    try {
      const userId = req.auth?.id || null;
      const sessionId = CartController.getSessionId(req);

      const data = await CartService.getSimilarFromCart(userId, sessionId);

      return ApiResponse.success(res, {
        message: "Similar products fetched successfully",
        data,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.getSimilarFromCart");
    }
  }

  /**
   * Copy user cart to a new guest cart before logout (so cart persists as guest)
   * POST /api/frontend/cart/keep-as-guest
   */
  static async keepAsGuest(req, res) {
    try {
      const userId = req.auth?.id;

      if (!userId) {
        return ApiResponse.error(res, {
          message: "User must be logged in",
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }

      const sessionId = await CartService.keepCartAsGuest(userId);

      if (sessionId) {
        res.cookie(GUEST_SESSION_COOKIE, sessionId, {
          maxAge: COOKIE.GUEST_SESSION_MAX_AGE,
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          path: "/",
        });
      }

      return ApiResponse.success(res, {
        message: "Cart saved as guest",
        data: null,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "CartController.keepAsGuest");
    }
  }

  /**
   * Merge guest cart into user cart (call after login)
   * POST /api/frontend/cart/merge
   */
  static async mergeCart(req, res) {
    try {
      const userId = req.auth?.id;
      const sessionId = req.cookies?.guest_cart_session;

      console.log("Merging cart for user:", userId, "with session:", sessionId);

      if (!userId) {
        return ApiResponse.error(res, {
          message: "User must be logged in to merge cart",
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }

      if (sessionId) {
        console.log("Guest cart session found, merging cart...");
        await CartService.mergeGuestCart(userId, sessionId);
        res.clearCookie(GUEST_SESSION_COOKIE);
      }

      console.log("Cart merge completed, fetching updated cart...");

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

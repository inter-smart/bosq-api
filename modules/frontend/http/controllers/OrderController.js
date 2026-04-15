const { validationResult } = require("express-validator");
const OrderService = require("../services/orderService.js");
const { ApiResponse } = require("../traits/response.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS } = require("../traits/constants.js");
const { placeOrderRequest, getOrderByIdRequest, cancelOrderRequest, reorderOrderRequest, getOrdersRequest } = require("../request/orderRequest.js");

const GUEST_SESSION_COOKIE = "guest_cart_session";

class OrderController {
  /**
   * Get session ID from cookie
   */
  static getSessionId(req) {
    return req.cookies?.[GUEST_SESSION_COOKIE] || null;
  }

  /**
   * Place a new order from the active cart
   * POST /api/frontend/orders/place
   */
  static async placeOrder(req, res) {
    try {
      await Promise.all(placeOrderRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const cartOwner = req.cartOwner;

      const { payment_type, address, type = "cart", coupon_code = null } = req.body;

      if (!cartOwner) {
        return ApiResponse.error(res, {
          message: "User must be logged in or have an active cart session",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const order = await OrderService.placeOrder(cartOwner, payment_type, address, type, coupon_code);

      const responseData = {
        ...order,
        requires_payment: payment_type === "online",
      };

      return ApiResponse.success(res, {
        message: payment_type === "online" ? "Order created. Proceed to payment." : "Order placed successfully",
        data: responseData,
        status: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "OrderController.placeOrder");
    }
  }

  /**
   * Get all orders for the authenticated user
   * GET /api/frontend/orders
   */
  static async getOrders(req, res) {
    try {
      await Promise.all(getOrdersRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const userId = req.auth?.id || null;
      const sessionId = OrderController.getSessionId(req);

      if (!userId && !sessionId) {
        return ApiResponse.success(res, {
          message: "Orders retrieved successfully",
          data: { orders: [], pagination: { total: 0, page: 1, limit: 12, total_pages: 0 } },
          status: HTTP_STATUS.OK,
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;

      const result = await OrderService.getOrders(userId, sessionId, { page, limit });

      return ApiResponse.paginated(res, {
        message: "Orders retrieved successfully",
        data: { orders: result.orders, pagination: result.pagination },
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "OrderController.getOrders");
    }
  }

  /**
   * Get a single order by ID
   * GET /api/frontend/orders/:orderId
   */
  static async getOrderById(req, res) {
    try {
      await Promise.all(getOrderByIdRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const userId = req.auth?.id || null;
      const sessionId = OrderController.getSessionId(req);
      const { orderId } = req.params;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or have an active cart session",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const order = await OrderService.getOrderById(userId, sessionId, parseInt(orderId));

      return ApiResponse.success(res, {
        message: "Order retrieved successfully",
        data: order,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "OrderController.getOrderById");
    }
  }

  /**
   * Cancel a pending order
   * PUT /api/frontend/orders/:orderId/cancel
   */
  static async cancelOrder(req, res) {
    try {
      await Promise.all(cancelOrderRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const userId = req.auth?.id || null;
      const sessionId = OrderController.getSessionId(req);
      const { orderId } = req.params;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or have an active cart session",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const order = await OrderService.cancelOrder(userId, sessionId, parseInt(orderId));

      return ApiResponse.success(res, {
        message: "Order cancelled successfully",
        data: order,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "OrderController.cancelOrder");
    }
  }

  /**
   * Reorder — add items from an existing order to the active cart
   * POST /api/frontend/orders/:orderId/reorder
   */
  static async reorderOrder(req, res) {
    try {
      await Promise.all(reorderOrderRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const userId = req.auth?.id || null;
      const sessionId = OrderController.getSessionId(req);
      const { orderId } = req.params;

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "User must be logged in or have an active cart session",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const cart = await OrderService.reorderOrder(userId, sessionId, parseInt(orderId));

      return ApiResponse.success(res, {
        message: "Items added to cart successfully",
        data: cart,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "OrderController.reorderOrder");
    }
  }
}

module.exports = OrderController;

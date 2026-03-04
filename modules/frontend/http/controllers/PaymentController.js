"use strict";

const PaymentService = require("../services/PaymentService.js");
const { ApiResponse } = require("../traits/response.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS } = require("../traits/constants.js");
const logger = require("../../../../config/logger.js");

const GUEST_SESSION_COOKIE = "guest_cart_session";

class PaymentController {
  static getSessionId(req) {
    return req.cookies?.[GUEST_SESSION_COOKIE] || null;
  }

  /**
   * POST /api/frontend/orders/:orderId/initiate-payment
   *
   * Creates a payment session on the Network Gateway and returns the hosted payment URL.
   */
  static async initiatePayment(req, res) {
    try {
      const userId = req.auth?.id || null;
      const sessionId = PaymentController.getSessionId(req);
      const orderId = parseInt(req.params.orderId, 10);
      const locale = req.query.locale || "en";

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "Authentication required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const result = await PaymentService.initiatePayment({
        orderId,
        userId,
        sessionId,
        locale,
      });

      return ApiResponse.success(res, {
        message: "Payment initiated successfully",
        data: {
          payment_url: result.paymentUrl,
          transaction_id: result.transactionId,
          order_reference: result.orderReference,
        },
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "PaymentController.initiatePayment");
    }
  }

  // controllers/payment.controller.js

  static async verifyPayment(req, res) {
    try {
      const { ref } = req.query;

      if (!ref) {
        return res.status(400).json({ success: false, message: "Missing ref" });
      }

      const result = await PaymentService.verifyAndUpdateOrder(ref);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error(`[VerifyPayment] ${error.message}`);
      const status = error.status || 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/frontend/orders/:orderId/payment-status
   *
   * Returns the current payment status for an order from the DB.
   */
  static async getPaymentStatus(req, res) {
    try {
      const userId = req.auth?.id || null;
      const sessionId = PaymentController.getSessionId(req);
      const orderId = parseInt(req.params.orderId, 10);

      if (!userId && !sessionId) {
        return ApiResponse.error(res, {
          message: "Authentication required",
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }

      const result = await PaymentService.getPaymentStatus({
        orderId,
        userId,
        sessionId,
      });

      return ApiResponse.success(res, {
        message: "Payment status retrieved",
        data: result,
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "PaymentController.getPaymentStatus");
    }
  }
}

module.exports = PaymentController;

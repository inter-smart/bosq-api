"use strict";

const NetworkService = require("../services/networkService.js");
const OrderService = require("../services/orderService.js");
const { models, sequelize } = require("../../../../database/models/index.js");
const { ApiResponse } = require("../traits/response.js");
const { ErrorHandler } = require("../traits/errorHandler.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");

const GUEST_SESSION_COOKIE = "guest_cart_session";

class PaymentController {
  static getSessionId(req) {
    return req.cookies?.[GUEST_SESSION_COOKIE] || null;
  }

  /**
   * POST /api/frontend/orders/:orderId/initiate-payment
   *
   * Creates a payment session on the Network Gateway and returns the hosted payment URL.
   * The order row is locked (SELECT FOR UPDATE) before the gateway call so that concurrent
   * requests cannot initiate two payments for the same order.
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

      const whereClause = userId
        ? { id: orderId, user_id: userId }
        : { id: orderId, session_id: sessionId, user_id: null };

      // ── Open transaction and lock the row before touching the gateway ──
      const transaction = await sequelize.transaction();
      try {
        const order = await models.Orders.findOne({
          where: whereClause,
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!order) {
          await transaction.rollback();
          return ApiResponse.error(res, {
            message: "Order not found",
            status: HTTP_STATUS.NOT_FOUND,
            error_code: ERROR_CODES.NOT_FOUND_ERROR,
          });
        }

        if (order.payment_type !== "online") {
          await transaction.rollback();
          return ApiResponse.error(res, {
            message: "This order does not require online payment",
            status: HTTP_STATUS.BAD_REQUEST,
            error_code: ERROR_CODES.VALIDATION_ERROR,
          });
        }

        if (order.payment_status === "paid") {
          await transaction.rollback();
          return ApiResponse.error(res, {
            message: "This order has already been paid",
            status: HTTP_STATUS.CONFLICT,
            error_code: ERROR_CODES.VALIDATION_ERROR,
          });
        }

        const clientBaseUrl = process.env.CLIENT_BASE_URL || process.env.APP_URL || "http://localhost:3000";
        const returnUrl = `${clientBaseUrl}/${locale}/order/payment-success?orderId=${orderId}`;
        const cancelUrl = `${clientBaseUrl}/${locale}/order/payment-failed?orderId=${orderId}`;

        // Call the gateway outside the DB lock — network I/O should not hold a row lock
        // Roll back the empty transaction first, then re-open after the API call
        await transaction.rollback();

        const { transactionId, paymentUrl } = await NetworkService.createPayment({
          amount: order.grand_total,
          currency: "AED",
          orderReference: order.order_id,
          returnUrl,
          cancelUrl,
          description: `Order ${order.order_id}`,
        });

        // ── Second transaction: persist the gateway transaction ID atomically ──
        const saveTransaction = await sequelize.transaction();
        try {
          await OrderService.updatePaymentStatus(
            orderId,
            "pending",
            {
              network_transaction_id: transactionId,
              order_reference: order.order_id,
            },
            saveTransaction,
          );
          await saveTransaction.commit();
        } catch (err) {
          if (!saveTransaction.finished) await saveTransaction.rollback();
          throw err;
        }

        return ApiResponse.success(res, {
          message: "Payment initiated successfully",
          data: {
            payment_url: paymentUrl,
            transaction_id: transactionId,
            order_reference: order.order_id,
          },
          status: HTTP_STATUS.OK,
        });
      } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
      }
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "PaymentController.initiatePayment");
    }
  }

  /**
   * GET /api/frontend/orders/:orderId/payment-status
   *
   * Returns the current payment status for an order from the DB.
   * The webhook is the authoritative source of truth for status updates.
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

      const whereClause = userId
        ? { id: orderId, user_id: userId }
        : { id: orderId, session_id: sessionId, user_id: null };

      const order = await models.Orders.findOne({ where: whereClause });

      if (!order) {
        return ApiResponse.error(res, {
          message: "Order not found",
          status: HTTP_STATUS.NOT_FOUND,
          error_code: ERROR_CODES.NOT_FOUND_ERROR,
        });
      }

      if (!order.network_transaction_id) {
        return ApiResponse.error(res, {
          message: "No payment initiated for this order",
          status: HTTP_STATUS.BAD_REQUEST,
          error_code: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return ApiResponse.success(res, {
        message: "Payment status retrieved",
        data: {
          payment_status: order.payment_status,
          transaction_id: order.network_transaction_id,
          order_reference: order.order_reference,
          order_id: order.order_id,
        },
        status: HTTP_STATUS.OK,
      });
    } catch (error) {
      return ErrorHandler.handleControllerError(error, res, "PaymentController.getPaymentStatus");
    }
  }
}

module.exports = PaymentController;

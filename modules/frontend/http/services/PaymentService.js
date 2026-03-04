"use strict";

const NetworkService = require("./networkService.js");
const OrderService = require("./orderService.js");
const { models, sequelize } = require("../../../../database/models/index.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");

class PaymentService {
  /**
   * Initiates a payment session by locking the order record, validating the order state,
   * calling the network gateway, and then updating the order with the gateway's transaction ID.
   *
   * @param {Object} params
   * @param {number} params.orderId
   * @param {string|null} params.userId
   * @param {string|null} params.sessionId
   * @param {string} params.locale
   * @returns {Promise<Object>} Object containing paymentUrl and transactionId.
   */
  static async initiatePayment({ orderId, userId, sessionId, locale }) {
    const whereClause = userId ? { id: orderId, user_id: userId } : { id: orderId, session_id: sessionId, user_id: null };

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
        const error = new Error("Order not found");
        error.status = HTTP_STATUS.NOT_FOUND;
        error.error_code = ERROR_CODES.NOT_FOUND_ERROR;
        throw error;
      }

      if (order.payment_type !== "online") {
        await transaction.rollback();
        const error = new Error("This order does not require online payment");
        error.status = HTTP_STATUS.BAD_REQUEST;
        error.error_code = ERROR_CODES.VALIDATION_ERROR;
        throw error;
      }

      if (order.payment_status === "paid") {
        await transaction.rollback();
        const error = new Error("This order has already been paid");
        error.status = HTTP_STATUS.CONFLICT;
        error.error_code = ERROR_CODES.VALIDATION_ERROR;
        throw error;
      }

      // Idempotency: if payment already initiated, return the stored URL without hitting the gateway again
      if (order.network_transaction_id && order.gateway_response?.payment_url) {
        await transaction.rollback();
        return {
          paymentUrl: order.gateway_response.payment_url,
          transactionId: order.network_transaction_id,
          orderReference: order.order_reference,
        };
      }

      const clientBaseUrl = process.env.CLIENT_BASE_URL;
      const returnUrl = `${clientBaseUrl}/${locale}/order/success?orderId=${orderId}`;
      const cancelUrl = `${clientBaseUrl}/${locale}/order/failed?orderId=${orderId}`;

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

      console.log("Payment initiated with Network Gateway:", { transactionId, paymentUrl });

      // ── Second transaction: persist the gateway transaction ID atomically ──
      const saveTransaction = await sequelize.transaction();
      try {
        await OrderService.updatePaymentStatus(
          orderId,
          "pending",
          {
            network_transaction_id: transactionId,
            order_reference: order.order_id,
            gateway_response: { payment_url: paymentUrl },
          },
          saveTransaction,
        );
        await saveTransaction.commit();

        return {
          paymentUrl,
          transactionId,
          orderReference: order.order_id,
        };
      } catch (err) {
        if (!saveTransaction.finished) await saveTransaction.rollback();
        throw err;
      }
    } catch (err) {
      if (transaction && !transaction.finished) await transaction.rollback();
      throw err;
    }
  }

  /**
   * Retrieves the payment status of an order.
   *
   * @param {Object} params
   * @param {number} params.orderId
   * @param {string|null} params.userId
   * @param {string|null} params.sessionId
   * @returns {Promise<Object>} Status details.
   */
  static async getPaymentStatus({ orderId, userId, sessionId }) {
    const whereClause = userId ? { id: orderId, user_id: userId } : { id: orderId, session_id: sessionId, user_id: null };

    const order = await models.Orders.findOne({ where: whereClause });

    if (!order) {
      const error = new Error("Order not found");
      error.status = HTTP_STATUS.NOT_FOUND;
      error.error_code = ERROR_CODES.NOT_FOUND_ERROR;
      throw error;
    }

    if (!order.network_transaction_id) {
      const error = new Error("No payment initiated for this order");
      error.status = HTTP_STATUS.BAD_REQUEST;
      error.error_code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    return {
      payment_status: order.payment_status,
      transaction_id: order.network_transaction_id,
      order_reference: order.order_reference,
      order_id: order.order_id,
    };
  }
}

module.exports = PaymentService;

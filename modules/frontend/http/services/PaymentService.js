"use strict";

const NetworkService = require("./networkService.js");
const OrderService = require("./orderService.js");
const { models, sequelize } = require("../../../../database/models/index.js");
const { HTTP_STATUS, ERROR_CODES } = require("../traits/constants.js");
const Logger = require("../../../../config/logger.js");

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

  // services/payment.service.js

  static async verifyAndUpdateOrder(ref) {
    // 1. Fetch real order state from N-Genius using the UUID ref
    const token = await NetworkService.getAccessToken();

    const response = await fetch(`${process.env.NETWORK_BASE_URL}/transactions/outlets/${process.env.NETWORK_MERCHANT_ID}/orders/${ref}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.ni-payment.v2+json",
      },
    });

    if (!response.ok) {
      Logger.error(`[VerifyPayment] N-Genius fetch failed: ${response.status}`);
      const error = new Error("Failed to fetch order from payment gateway");
      error.status = 502;
      throw error;
    }

    const nGeniusOrder = await response.json();

    // 2. Extract key fields from N-Genius response
    const state = nGeniusOrder._embedded?.payment?.[0]?.state; // CAPTURED, FAILED etc.
    const merchantRef = nGeniusOrder.merchantOrderReference; // your internal order_id
    const amount = nGeniusOrder.amount?.value;
    const currency = nGeniusOrder.amount?.currencyCode;

    Logger.info(`[VerifyPayment] ref: ${ref} | state: ${state} | merchantRef: ${merchantRef}`);

    if (!merchantRef) {
      const error = new Error("Order not found in payment gateway");
      error.status = 404;
      throw error;
    }

    // 3. Map N-Genius state → your internal status
    const resolvedStatus = NetworkService.mapStatus(state); // 'paid' | 'failed' | 'cancelled'

    // 4. Find order in DB using merchantOrderReference
    const order = await models.Orders.findOne({ where: { order_id: merchantRef } });

    if (!order) {
      Logger.warn(`[VerifyPayment] Order not found in DB for merchantRef: ${merchantRef}`);
      // Still return the status — don't throw, so UI can show result
      return { resolvedStatus, merchantRef, state };
    }

    // 5. Idempotency check — same as your webhook handler
    const isTerminal = order.payment_status === "paid" || order.payment_status === "failed";
    const isRefundOnPaidOrder = resolvedStatus === "refunded" && order.payment_status === "paid";

    if (isTerminal && !isRefundOnPaidOrder) {
      Logger.info(`[VerifyPayment] Already processed for order ${merchantRef} (${order.payment_status}) — skipping DB update`);
      // Return current DB status instead of N-Genius state (source of truth is your DB)
      return {
        resolvedStatus: order.payment_status === "paid" ? "paid" : "failed",
        merchantRef: order.order_id,
        state,
      };
    }

    // 6. Atomically update DB — exactly mirrors your webhook handler
    const transaction = await sequelize.transaction();
    try {
      await OrderService.updatePaymentStatus(
        order.id,
        resolvedStatus,
        {
          network_transaction_id: ref, // N-Genius order UUID
          order_reference: merchantRef,
          gateway_response: nGeniusOrder,
        },
        transaction,
      );

      if (resolvedStatus === "paid") {
        await models.Orders.update({ status: "confirmed" }, { where: { id: order.id }, transaction });
      }

      if (resolvedStatus === "failed") {
        await OrderService.revertOrderStock(order.id, transaction);
        await models.Orders.update({ status: "cancelled" }, { where: { id: order.id }, transaction });
      }

      if (resolvedStatus === "refunded") {
        await models.Orders.update({ status: "returned", payment_status: "refunded" }, { where: { id: order.id }, transaction });
      }

      await transaction.commit();

      // 7. Send confirmation email after successful payment (non-blocking)
      if (resolvedStatus === "paid") {
        OrderService.sendOrderConfirmationEmail(order.id).catch((err) =>
          Logger.error(`[VerifyPayment] Email failed for order ${order.id}: ${err.message}`),
        );
      }
    } catch (err) {
      if (!transaction.finished) await transaction.rollback();
      throw err;
    }

    Logger.info(`[VerifyPayment] Processed order ${merchantRef} → ${resolvedStatus}`);

    return {
      resolvedStatus, // 'paid' | 'failed' | 'cancelled' — used by Next.js UI
      merchantRef, // your internal order_id — shown in UI as order number
      state, // raw N-Genius state — useful for debugging
    };
  }
}

module.exports = PaymentService;

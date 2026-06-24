"use strict";

const NetworkService = require("./networkService.js");
const OrderService = require("./orderService.js");
const { models, sequelize } = require("../../../../database/models/index.js");
const { Op } = require("sequelize");
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

    // Plain read — guards below are the safety net; no row-lock needed here
    const order = await models.Orders.findOne({
      where: whereClause,
      include: [
        {
          model: models.OrderAddress,
          as: "addresses",
        },
      ],
    });

    if (!order) {
      const error = new Error("Order not found");
      error.status = HTTP_STATUS.NOT_FOUND;
      error.error_code = ERROR_CODES.NOT_FOUND_ERROR;
      throw error;
    }

    if (order.payment_type !== "online") {
      const error = new Error("This order does not require online payment");
      error.status = HTTP_STATUS.BAD_REQUEST;
      error.error_code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (order.payment_status === "paid") {
      const error = new Error("This order has already been paid");
      error.status = HTTP_STATUS.CONFLICT;
      error.error_code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    // Idempotency: return the existing session without hitting the gateway again
    if (order.network_transaction_id && order.gateway_response?.payment_url) {
      return {
        paymentUrl: order.gateway_response.payment_url,
        transactionId: order.network_transaction_id,
        orderReference: order.order_reference,
      };
    }

    const billingAddress = order.addresses.find((a) => a.address_type === "billing");

    if (!billingAddress) {
      const error = new Error("Billing address not found");
      error.status = HTTP_STATUS.NOT_FOUND;
      error.error_code = ERROR_CODES.NOT_FOUND_ERROR;
      throw error;
    }

    const clientBaseUrl = process.env.CLIENT_BASE_URL;
    const customerEmail = billingAddress?.email;

    if (!customerEmail) {
      const error = new Error("Customer email not found");
      error.status = HTTP_STATUS.NOT_FOUND;
      error.error_code = ERROR_CODES.NOT_FOUND_ERROR;
      throw error;
    }

    // N-Genius appends ?ref={orderUUID} to this URL automatically after payment
    const redirectUrl = `${clientBaseUrl}/${locale}/order?orderId=${orderId}`;

    const { transactionId, paymentUrl } = await NetworkService.createPayment({
      amount: order.grand_total,
      currency: "AED",
      returnUrl: redirectUrl,
      cancelUrl: redirectUrl,
      orderReference: order.order_id,
      email: customerEmail,
    });

    Logger.info(`[Payment] N-Genius session created: transactionId=${transactionId}`);

    // Atomically persist gateway data
    const saveTransaction = await sequelize.transaction();
    try {
      await OrderService.updatePaymentStatus(
        orderId,
        "pending",
        {
          network_transaction_id: transactionId,
          order_reference: order.order_id,
          gateway_response: {
            payment_url: paymentUrl,
            redirect_url: redirectUrl,
            transaction_id: transactionId,
          },
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
    // Webhook now handles all DB updates. This endpoint only reads the current payment_status
    // from the DB so the UI can poll until the webhook has processed the payment.

    // Look up by network_transaction_id (set at payment initiation = N-Genius order UUID)
    // OR order_reference (set by webhook after AUTHORISED fires = N-Genius order UUID).
    const order = await models.Orders.findOne({
      where: {
        [Op.or]: [{ network_transaction_id: ref }, { order_reference: ref }],
      },
    });

    if (!order) {
      Logger.warn(`[VerifyPayment] Order not found in DB for ref: ${ref}`);
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    Logger.info(`[VerifyPayment] ref: ${ref} | payment_status: ${order.payment_status} | order_id: ${order.order_id}`);

    return {
      resolvedStatus: order.payment_status, // 'paid' | 'failed' | 'pending' — client retries on pending
      merchantRef: order.order_id,
    };

    // ─── Commented out: N-Genius fetch + DB update logic (now handled by webhook) ───
    //
    // // 1. Fetch real order state from N-Genius using the UUID ref
    // const token = await NetworkService.getAccessToken();
    //
    // const response = await fetch(`${process.env.NETWORK_BASE_URL}/transactions/outlets/${process.env.NETWORK_MERCHANT_ID}/orders/${ref}`, {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     Accept: "application/vnd.ni-payment.v2+json",
    //   },
    // });
    //
    // if (!response.ok) {
    //   Logger.error(`[VerifyPayment] N-Genius fetch failed: ${response.status}`);
    //   const error = new Error("Failed to fetch order from payment gateway");
    //   error.status = 502;
    //   throw error;
    // }
    //
    // const nGeniusOrder = await response.json();
    // const state = nGeniusOrder._embedded?.payment?.[0]?.state;
    // const merchantRef = nGeniusOrder.merchantOrderReference;
    // const amount = nGeniusOrder.amount?.value;
    // const currency = nGeniusOrder.amount?.currencyCode;
    //
    // Logger.info(`[VerifyPayment] ref: ${ref} | state: ${state} | merchantRef: ${merchantRef}`);
    //
    // if (!merchantRef) {
    //   const error = new Error("Order not found in payment gateway");
    //   error.status = 404;
    //   throw error;
    // }
    //
    // const resolvedStatus = NetworkService.mapStatus(state);
    // const order = await models.Orders.findOne({ where: { order_id: merchantRef } });
    //
    // if (!order) {
    //   Logger.warn(`[VerifyPayment] Order not found in DB for merchantRef: ${merchantRef}`);
    //   return { resolvedStatus, merchantRef, state };
    // }
    //
    // const isTerminal = order.payment_status === "paid" || order.payment_status === "failed";
    // const isRefundOnPaidOrder = resolvedStatus === "refunded" && order.payment_status === "paid";
    //
    // if (isTerminal && !isRefundOnPaidOrder) {
    //   Logger.info(`[VerifyPayment] Already processed for order ${merchantRef} (${order.payment_status}) — skipping DB update`);
    //   return {
    //     resolvedStatus: order.payment_status === "paid" ? "paid" : "failed",
    //     merchantRef: order.order_id,
    //     state,
    //   };
    // }
    //
    // const transaction = await sequelize.transaction();
    // try {
    //   await OrderService.updatePaymentStatus(order.id, resolvedStatus, {
    //     network_transaction_id: ref,
    //     order_reference: merchantRef,
    //     gateway_response: nGeniusOrder,
    //   }, transaction);
    //
    //   if (resolvedStatus === "paid") {
    //     await models.Orders.update({ status: "confirmed" }, { where: { id: order.id }, transaction });
    //   }
    //   if (resolvedStatus === "failed") {
    //     await OrderService.revertOrderStock(order.id, transaction);
    //     await models.Orders.update({ status: "cancelled" }, { where: { id: order.id }, transaction });
    //   }
    //   if (resolvedStatus === "refunded") {
    //     await models.Orders.update({ status: "returned", payment_status: "refunded" }, { where: { id: order.id }, transaction });
    //   }
    //
    //   const payment0 = nGeniusOrder._embedded?.payment?.[0];
    //   await models.PaymentTransaction.create({
    //     order_id: order.id, transaction_type: resolvedStatus === "refunded" ? "refund" : "charge",
    //     provider: "network_intl", provider_transaction_id: payment0?.reference ?? null,
    //     provider_order_id: ref, amount: amount != null ? (amount / 100).toFixed(2) : order.grand_total,
    //     currency: currency ?? "AED", status: state ?? null, resolved_status: resolvedStatus,
    //     payment_method: payment0?.paymentMethod?.name ?? null, auth_code: payment0?.authResponse?.authCode ?? null,
    //     result_code: payment0?.authResponse?.resultCode ?? null, source: "verify", raw_response: nGeniusOrder,
    //   }, { transaction });
    //
    //   await transaction.commit();
    //
    //   if (resolvedStatus === "paid") {
    //     OrderService.sendOrderConfirmationEmail(order.id).catch((err) =>
    //       Logger.error(`[VerifyPayment] Email failed for order ${order.id}: ${err.message}`));
    //   }
    //   if (resolvedStatus === "failed") {
    //     OrderService.sendOrderStatusEmail(order.id, "cancelled").catch((err) =>
    //       Logger.error(`[VerifyPayment] Cancellation email failed for order ${order.id}: ${err.message}`));
    //   }
    //   if (resolvedStatus === "refunded") {
    //     OrderService.sendOrderStatusEmail(order.id, "returned").catch((err) =>
    //       Logger.error(`[VerifyPayment] Refund email failed for order ${order.id}: ${err.message}`));
    //   }
    // } catch (err) {
    //   if (!transaction.finished) await transaction.rollback();
    //   throw err;
    // }
    //
    // Logger.info(`[VerifyPayment] Processed order ${merchantRef} → ${resolvedStatus}`);
    // return { resolvedStatus, merchantRef, state };
  }
}

module.exports = PaymentService;

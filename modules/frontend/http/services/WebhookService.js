"use strict";

const NetworkService = require("./networkService.js");
const OrderService = require("./orderService.js");
const { models, sequelize } = require("../../../../database/models/index.js");
const Logger = require("../../../../config/logger.js");

class WebhookService {
  /**
   * Processes a payment webhook from the gateway.
   *
   * @param {Object} payload The webhook payload from req.body
   * @returns {Promise<{success: boolean, message: string, resolvedStatus?: string}>}
   */
  static async handleWebhook(payload, headers) {
    console.log("Received webhook payload: ======================>", payload);

    // 1. ✅ Validate X-Webhook-Token header (N-Genius auth method — no HMAC signature)
    const webhookToken = headers["x-webhook-token"];

    console.log(webhookToken);
    console.log(process.env.NETWORK_WEBHOOK_SECRET);

    if (!webhookToken || webhookToken !== process.env.NETWORK_WEBHOOK_SECRET) {
      Logger.warn(`[Webhook] Invalid or missing X-Webhook-Token`);
      const error = new Error("Unauthorized request");
      error.status = 401;
      throw error;
    }

    // 2. ✅ Map N-Genius payload fields to your internal variable names
    const {
      orderReference: transaction_id, // N-Genius order UUID
      merchantOrderReference: reference, // your internal order_id (what you passed on creation)
      state: status, // CAPTURED, FAILED, DECLINED, REFUNDED etc.
      amount,
      currency,
    } = payload;

    Logger.info(`[Webhook] Received state "${status}" for order ${reference}`);

    // 3. Find the order by our internal order_id (which we sent as merchantOrderReference)
    const order = await models.Orders.findOne({ where: { order_id: reference } });
    if (!order) {
      Logger.warn(`[Webhook] Order not found for reference ${reference}`);
      return { success: true, message: "Order not found, acknowledged" };
    }

    // 4. Map N-Genius status to our internal payment_status
    const resolvedStatus = NetworkService.mapStatus(status);

    // 5. Idempotency check — skip if already in a terminal state.
    //    Exception: allow REFUNDED through even after "paid" so refunds can be processed.
    const isTerminal = order.payment_status === "paid" || order.payment_status === "failed";
    const isRefundOnPaidOrder = resolvedStatus === "refunded" && order.payment_status === "paid";

    if (isTerminal && !isRefundOnPaidOrder) {
      Logger.info(`[Webhook] Duplicate webhook ignored for order ${reference} (status already ${order.payment_status})`);
      return { success: true, message: "Already processed" };
    }

    // 6. Atomically update payment status + trigger business logic in one transaction
    const transaction = await sequelize.transaction();
    try {
      await OrderService.updatePaymentStatus(
        order.id,
        resolvedStatus,
        {
          network_transaction_id: transaction_id,
          order_reference: reference,
          gateway_response: payload,
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

      if (resolvedStatus === "paid") {
        OrderService.sendOrderConfirmationEmail(order.id).catch((err) =>
          Logger.error(`Failed to trigger order confirmation email from webhook for order ${order.id}: ${err.message}`),
        );
      }

      if (resolvedStatus === "failed") {
        OrderService.sendOrderStatusEmail(order.id, "cancelled").catch((err) =>
          Logger.error(`[Webhook] Cancellation email failed for order ${order.id}: ${err.message}`),
        );
      }

      if (resolvedStatus === "refunded") {
        OrderService.sendOrderStatusEmail(order.id, "returned").catch((err) =>
          Logger.error(`[Webhook] Refund email failed for order ${order.id}: ${err.message}`),
        );
      }
    } catch (err) {
      if (!transaction.finished) await transaction.rollback();
      throw err;
    }

    Logger.info(`[Webhook] Processed state "${status}" for order ${reference} → resolvedStatus: ${resolvedStatus}`);
    return { success: true, message: "Webhook processed", resolvedStatus };
  }
}

module.exports = WebhookService;

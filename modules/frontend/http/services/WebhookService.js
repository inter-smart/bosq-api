"use strict";

const NetworkService = require("./networkService.js");
const OrderService = require("./orderService.js");
const { models, sequelize } = require("../../../../database/models/index.js");
const Logger = require("../../../../config/logger.js");

class WebhookService {
  static async handleWebhook(payload, headers) {
    console.log("Received webhook payload: ======================>", payload);

    // 1. ✅ Validate X-Webhook-Token header (unchanged — your logic is correct)
    const webhookToken = headers["x-webhook-token"];
    if (!webhookToken || webhookToken !== process.env.NETWORK_WEBHOOK_SECRET) {
      Logger.warn(`[Webhook] Invalid or missing X-Webhook-Token`);
      const error = new Error("Unauthorized request");
      error.status = 401;
      throw error;
    }

    // 2. ✅ FIX: Correctly extract from the nested N-Genius payload structure
    const { eventName, order } = payload;
    const payment = order?._embedded?.payment?.[0];

    if (!order || !payment) {
      Logger.warn(`[Webhook] Malformed payload — missing order or payment block`);
      return { success: true, message: "Malformed payload, acknowledged" };
    }

    const status = eventName; // "CAPTURED", "FAILED" etc.
    const transaction_id = payment.reference; // payment UUID
    const ngeniusOrderId = order.reference; // N-Genius order UUID
    const amount = order.amount; // { currencyCode, value }
    const authResponse = payment.authResponse; // auth code, result code

    Logger.info(`[Webhook] Event "${status}" for N-Genius order ${ngeniusOrderId}`);

    // 3. ✅ FIX: Look up by network_transaction_id (= data.reference saved at creation)
    //    NOT by order_id — merchantOrderReference is never echoed back in the webhook
    const dbOrder = await models.Orders.findOne({
      where: { network_transaction_id: ngeniusOrderId },
    });
    if (!dbOrder) {
      Logger.warn(`[Webhook] Order not found for N-Genius ref ${ngeniusOrderId}`);
      return { success: true, message: "Order not found, acknowledged" };
    }

    // 4. ✅ Map event name to internal status (mapStatus unchanged — eventName values match)
    const resolvedStatus = NetworkService.mapStatus(status);

    // 5. ✅ Idempotency check (unchanged — logic is correct)
    const isTerminal = dbOrder.payment_status === "paid" || dbOrder.payment_status === "failed";
    const isRefundOnPaidOrder = resolvedStatus === "refunded" && dbOrder.payment_status === "paid";

    if (isTerminal && !isRefundOnPaidOrder) {
      Logger.info(`[Webhook] Duplicate ignored for order ${ngeniusOrderId} (already ${dbOrder.payment_status})`);
      return { success: true, message: "Already processed" };
    }

    // 6. ✅ Atomic update (unchanged logic, fixed field values passed in)
    const transaction = await sequelize.transaction();
    try {
      await OrderService.updatePaymentStatus(
        dbOrder.id,
        resolvedStatus,
        {
          network_transaction_id: transaction_id, // FIX: payment UUID (more specific than order UUID)
          order_reference: ngeniusOrderId, // FIX: N-Genius order UUID
          gateway_response: payload,
        },
        transaction,
      );

      if (resolvedStatus === "paid") {
        await models.Orders.update({ status: "confirmed" }, { where: { id: dbOrder.id }, transaction });
      }

      if (resolvedStatus === "failed") {
        await OrderService.revertOrderStock(dbOrder.id, transaction);
        await models.Orders.update({ status: "cancelled" }, { where: { id: dbOrder.id }, transaction });
      }

      if (resolvedStatus === "refunded") {
        await models.Orders.update({ status: "returned", payment_status: "refunded" }, { where: { id: dbOrder.id }, transaction });
      }

      await transaction.commit();

      // 7. ✅ Post-commit side effects (unchanged — fire-and-forget emails)
      if (resolvedStatus === "paid") {
        OrderService.sendOrderConfirmationEmail(dbOrder.id).catch((err) =>
          Logger.error(`[Webhook] Confirmation email failed for order ${dbOrder.id}: ${err.message}`),
        );
      }
      if (resolvedStatus === "failed") {
        OrderService.sendOrderStatusEmail(dbOrder.id, "cancelled").catch((err) =>
          Logger.error(`[Webhook] Cancellation email failed for order ${dbOrder.id}: ${err.message}`),
        );
      }
      if (resolvedStatus === "refunded") {
        OrderService.sendOrderStatusEmail(dbOrder.id, "returned").catch((err) =>
          Logger.error(`[Webhook] Refund email failed for order ${dbOrder.id}: ${err.message}`),
        );
      }
    } catch (err) {
      if (!transaction.finished) await transaction.rollback();
      throw err;
    }

    Logger.info(`[Webhook] Processed "${status}" for ${ngeniusOrderId} → ${resolvedStatus}`);
    return { success: true, message: "Webhook processed", resolvedStatus };
  }
}

module.exports = WebhookService;

"use strict";

const NetworkService = require("../services/networkService.js");
const OrderService = require("../services/orderService.js");
const { models, sequelize } = require("../../../../database/models/index.js");
const Logger = require("../../../../config/logger.js");

class WebhookController {
  /**
   * POST /api/frontend/payment/webhook
   *
   * Receives payment status notifications from the Network Payment Gateway.
   *
   * Payload shape:
   * {
   *   event: "payment.success" | "payment.failed" | ...,
   *   transaction_id: "txn_123456",
   *   reference: "ORDER_12345",
   *   amount: 10000,          // minor currency units (integer)
   *   currency: "USD",
   *   status: "SUCCESS",
   *   signature: "generated_signature"
   * }
   */
  static async handleWebhook(req, res) {
    try {
      const { event, transaction_id, reference, amount, currency, status, signature } = req.body;

      // 1. Verify HMAC-SHA256 signature — reject immediately if invalid
      const isValid = NetworkService.verifyWebhookSignature(transaction_id, amount, reference, signature);
      if (!isValid) {
        Logger.warn(`[Webhook] Invalid signature for transaction ${transaction_id}, reference ${reference}`);
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      // 2. Find the order by our internal order_id (which we sent as reference)
      const order = await models.Orders.findOne({ where: { order_id: reference } });
      if (!order) {
        Logger.warn(`[Webhook] Order not found for reference ${reference}`);
        // Return 200 to acknowledge receipt — avoid Network retrying for unknown orders
        return res.status(200).json({ success: true, message: "Order not found, acknowledged" });
      }

      // 3. Idempotency check — skip if already in a terminal state
      if (order.payment_status === "paid" || order.payment_status === "failed") {
        Logger.info(`[Webhook] Duplicate webhook ignored for order ${reference} (status already ${order.payment_status})`);
        return res.status(200).json({ success: true, message: "Already processed" });
      }

      // 4. Map Network status to our internal payment_status
      const resolvedStatus = NetworkService.mapStatus(status);

      // 5. Atomically update payment status + trigger business logic in one transaction
      const transaction = await sequelize.transaction();
      try {
        await OrderService.updatePaymentStatus(
          order.id,
          resolvedStatus,
          {
            network_transaction_id: transaction_id,
            order_reference: reference,
            gateway_response: req.body,
          },
          transaction,
        );

        // Business logic: confirm the order on successful payment
        if (resolvedStatus === "paid") {
          await models.Orders.update(
            { status: "confirmed" },
            { where: { id: order.id }, transaction },
          );
        }

        await transaction.commit();
      } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        throw err;
      }

      Logger.info(`[Webhook] Processed event "${event}" for order ${reference} → status: ${resolvedStatus}`);
      return res.status(200).json({ success: true, message: "Webhook processed" });
    } catch (error) {
      Logger.error(`[Webhook] handleWebhook error: ${error.message}`);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}

module.exports = WebhookController;

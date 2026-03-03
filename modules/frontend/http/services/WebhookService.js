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
    static async handleWebhook(payload) {
        const { event, transaction_id, reference, amount, currency, status, signature } = payload;

        // 1. Verify HMAC-SHA256 signature — reject immediately if invalid
        const isValid = NetworkService.verifyWebhookSignature(transaction_id, amount, reference, signature);
        if (!isValid) {
            Logger.warn(`[Webhook] Invalid signature for transaction ${transaction_id}, reference ${reference}`);
            const error = new Error("Invalid signature");
            error.status = 400;
            throw error;
        }

        // 2. Find the order by our internal order_id (which we sent as reference)
        const order = await models.Orders.findOne({ where: { order_id: reference } });
        if (!order) {
            Logger.warn(`[Webhook] Order not found for reference ${reference}`);
            return { success: true, message: "Order not found, acknowledged" };
        }

        // 3. Idempotency check — skip if already in a terminal state
        if (order.payment_status === "paid" || order.payment_status === "failed") {
            Logger.info(`[Webhook] Duplicate webhook ignored for order ${reference} (status already ${order.payment_status})`);
            return { success: true, message: "Already processed" };
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
                    gateway_response: payload,
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

            // Business logic: revert stock and cancel the order on failed/cancelled payment
            if (resolvedStatus === "failed") {
                await OrderService.revertOrderStock(order.id, transaction);
                await models.Orders.update(
                    { status: "cancelled" },
                    { where: { id: order.id }, transaction },
                );
            }

            await transaction.commit();

            // Trigger order confirmation email after successful payment
            if (resolvedStatus === "paid") {
                OrderService.sendOrderConfirmationEmail(order.id).catch((err) =>
                    Logger.error(`Failed to trigger order confirmation email from webhook for order ${order.id}: ${err.message}`)
                );
            }
        } catch (err) {
            if (!transaction.finished) await transaction.rollback();
            throw err;
        }

        Logger.info(`[Webhook] Processed event "${event}" for order ${reference} → status: ${resolvedStatus}`);
        return { success: true, message: "Webhook processed", resolvedStatus };
    }
}

module.exports = WebhookService;

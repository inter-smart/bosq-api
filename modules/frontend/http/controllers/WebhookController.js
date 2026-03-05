"use strict";

const WebhookService = require("../services/WebhookService.js");
const Logger = require("../../../../config/logger.js");

class WebhookController {
  /**
   * POST /api/frontend/payment/webhook
   *
   * Receives payment status notifications from the Network Payment Gateway.
   */
  static async handleWebhook(req, res) {
    try {
      const result = await WebhookService.handleWebhook(req.body, req.headers);

      return res.status(200).json(result);
    } catch (error) {
      Logger.error(`[Webhook] handleWebhook error: ${error.message}`);

      const status = error.status || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ success: false, message });
    }
  }
}

module.exports = WebhookController;

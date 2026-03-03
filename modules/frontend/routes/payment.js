const express = require("express");
const router = express.Router();
const WebhookController = require("../http/controllers/WebhookController.js");

// POST /api/frontend/payment/webhook
// Receives payment status notifications from the Network Payment Gateway.
// No auth middleware — the Network gateway calls this directly.
// Signature verification is performed inside the controller.
router.post("/webhook", WebhookController.handleWebhook);

module.exports = router;

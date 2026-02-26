const express = require("express");
const router = express.Router();
const OrderController = require("../http/controllers/OrderController.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");
const { addOrderConfirmationJob } = require("../../../queues/emailQueue.js");

// ─── TEST: fire a dummy order confirmation email via the queue ────────────────
// POST /api/frontend/orders/test-email  { "to": "you@example.com" }
router.post("/test-email", async (req, res) => {
  const email = req.body.to || req.body.email || "test@example.com";

  await addOrderConfirmationJob({
    orderId: 9999,
    orderCode: "BOSQ-TEST-0001",
    email,
    name: "Test Customer",
    paymentType: "cod",
    subtotal: "199.00",
    discount_total: "20.00",
    tax_total: "0.00",
    grand_total: "179.00",
    items: [
      { title: "Ergonomic Chair Pro", sku: "ECH-BLK-L", quantity: 1, price: "149.00", line_total: "149.00" },
      { title: "Lumbar Support Cushion", sku: "LSC-GRY-M", quantity: 2, price: "25.00", line_total: "50.00" },
    ],
  });

  res.json({ success: true, message: `Order confirmation email queued → ${email}` });
});

// Place a new order from active cart
router.post("/place", optionalAuth(), cartContext, OrderController.placeOrder);

// Get all orders for user
router.get("/", optionalAuth(), cartContext, OrderController.getOrders);

// Get a single order by ID
router.get("/:orderId", optionalAuth(), cartContext, OrderController.getOrderById);

// Cancel a pending order
router.put("/:orderId/cancel", optionalAuth(), cartContext, OrderController.cancelOrder);

// Reorder — add items from a past order to the active cart
router.post("/:orderId/reorder", optionalAuth(), cartContext, OrderController.reorderOrder);

module.exports = router;

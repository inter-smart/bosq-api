const express = require("express");
const router = express.Router();
const OrderController = require("../http/controllers/OrderController.js");
const PaymentController = require("../http/controllers/PaymentController.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");

// Place a new order from active cart
router.post("/place", optionalAuth(), cartContext, OrderController.placeOrder);

// Ge all cancelled Orders for user
router.get("/cancelled", optionalAuth(), cartContext, OrderController.getCancelledOrders);

// Get all orders for user
router.get("/", optionalAuth(), cartContext, OrderController.getOrders);

// Get a single order by ID
router.get("/:orderId", optionalAuth(), cartContext, OrderController.getOrderById);

// Cancel a pending order
router.put("/:orderId/cancel", optionalAuth(), cartContext, OrderController.cancelOrder);

// Reorder — add items from a past order to the active cart
router.post("/:orderId/reorder", optionalAuth(), cartContext, OrderController.reorderOrder);

// Initiate N-Genius payment for an online order — returns a payment_url to redirect the user to
router.post("/:orderId/initiate-payment", optionalAuth(), cartContext, PaymentController.initiatePayment);

// Check and update payment status after N-Genius callback
router.get("/:orderId/payment-status", optionalAuth(), cartContext, PaymentController.getPaymentStatus);

module.exports = router;

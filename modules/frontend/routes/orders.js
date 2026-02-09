const express = require("express");
const router = express.Router();
const OrderController = require("../http/controllers/OrderController.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");

// Place a new order from active cart
router.post("/place", optionalAuth(), cartContext, OrderController.placeOrder);

// Get all orders for user
router.get("/", optionalAuth(), cartContext, OrderController.getOrders);

// Get a single order by ID
router.get("/:orderId", optionalAuth(), cartContext, OrderController.getOrderById);

// Cancel a pending order
router.put("/:orderId/cancel", optionalAuth(), cartContext, OrderController.cancelOrder);

module.exports = router;

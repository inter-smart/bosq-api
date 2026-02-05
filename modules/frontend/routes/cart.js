const express = require("express");
const router = express.Router();
const CartController = require("../http/controllers/CartController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");

// Routes that work for both authenticated users and guests
router.get("/", optionalAuth(), CartController.getCart);
router.post("/add", optionalAuth(), CartController.addItem);
router.put("/item/:itemId", optionalAuth(), CartController.updateItem);
router.delete("/item/:itemId", optionalAuth(), CartController.removeItem);
router.delete("/clear", optionalAuth(), CartController.clearCart);

// Routes that require authentication
router.post("/merge", verifyToken(), CartController.mergeCart);

module.exports = router;

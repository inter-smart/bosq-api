const express = require("express");
const router = express.Router();
const CartController = require("../http/controllers/CartController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");

// Routes that work for both authenticated users and guests
router.get("/similar-products", optionalAuth(), cartContext, CartController.getSimilarFromCart);
router.get("/", optionalAuth(), cartContext, CartController.getCart);
router.post("/add", optionalAuth(), cartContext, CartController.addItem);
router.post("/add-together", optionalAuth(), cartContext, CartController.addMultipleItems);
router.post("/buynow", optionalAuth(), cartContext, CartController.buyNowItem);
router.put("/item/:itemId", optionalAuth(), cartContext, CartController.updateItem);
router.delete("/item/:itemId", optionalAuth(), cartContext, CartController.removeItem);
router.delete("/clear", optionalAuth(), cartContext, CartController.clearCart);

// Routes that require authentication
router.post("/merge", optionalAuth(), cartContext, CartController.mergeCart);
router.post("/keep-as-guest", optionalAuth(), CartController.keepAsGuest);

module.exports = router;

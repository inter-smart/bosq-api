const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/CheckOutController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");

router.get("/checkout-test", optionalAuth(), cartContext, Controller.testCheckout);
// Routes that work for both authenticated users and guests
router.get("/validate-checkout", optionalAuth(), cartContext, Controller.validateCheckout);
router.get("/cart-summary", optionalAuth(), cartContext, Controller.getCartData);
router.get("/cart-buynow", optionalAuth(), cartContext, Controller.getBuyNowCartData);
router.get("/cart-addresss", optionalAuth(), cartContext, Controller.getAddressForUsers);

// Coupon routes
router.post("/apply-coupon", verifyToken(), Controller.applyCoupon);
router.post("/remove-coupon", verifyToken(), Controller.removeCoupon);

module.exports = router;

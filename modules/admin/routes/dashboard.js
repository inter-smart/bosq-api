const express = require('express');
const router = express.Router();
const DashboardController = require('../http/controllers/DashboardController');
const authMiddleware = require("../http/middleware/authMiddleware");

router.use(authMiddleware(["admin"]));

router.get('/counts', DashboardController.getCounts);
router.get('/order-stats', DashboardController.getOrderStats);
router.get('/product-stats', DashboardController.getProductStats);
router.get('/coupon-analytics', DashboardController.getCouponAnalytics);
router.get('/user-stats', DashboardController.getUserStats);

module.exports = router;

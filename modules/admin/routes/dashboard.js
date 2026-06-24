const express = require('express');
const router = express.Router();
const DashboardController = require('../http/controllers/DashboardController');
const ActivityLogController = require('../http/controllers/ActivityLogController');
const requirePermission = require("../http/middleware/requirePermission.js");
// SSE endpoint — must be before authMiddleware since EventSource cannot send Authorization headers.
// Auth is validated inside the controller via ?token= query param.
router.get('/activity/stream', ActivityLogController.streamActivity);

router.use(requirePermission("dashboard"));
router.get('/counts', DashboardController.getCounts);
router.get('/order-stats', DashboardController.getOrderStats);
router.get('/product-stats', DashboardController.getProductStats);
router.get('/coupon-analytics', DashboardController.getCouponAnalytics);
router.get('/user-stats', DashboardController.getUserStats);

module.exports = router;

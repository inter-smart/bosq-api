const express = require('express');
const router = express.Router();
const DashboardController = require('../http/controllers/DashboardController');
const ActivityLogController = require('../http/controllers/ActivityLogController');
const authMiddleware = require("../http/middleware/authMiddleware");

// SSE endpoint — must be before authMiddleware since EventSource cannot send Authorization headers.
// Auth is validated inside the controller via ?token= query param.
router.get('/activity/stream', ActivityLogController.streamActivity);

router.use(authMiddleware(["admin"]));

router.get('/counts', DashboardController.getCounts);
router.get('/activity', ActivityLogController.getActivity);

module.exports = router;

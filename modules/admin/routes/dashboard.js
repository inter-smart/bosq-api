const express = require('express');
const router = express.Router();
const DashboardController = require('../http/controllers/DashboardController');
const authMiddleware = require("../http/middleware/authMiddleware");

router.use(authMiddleware(["admin"]));

router.get('/counts', DashboardController.getCounts);

module.exports = router;

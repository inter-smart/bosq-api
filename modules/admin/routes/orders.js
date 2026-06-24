const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/orders/OrderController");
const requirePermission = require("../http/middleware/requirePermission.js");
router.use(requirePermission("orders"));
router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.put("/:id", Controller.update);

module.exports = router;
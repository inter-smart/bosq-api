const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/orders/OrderController");
const authMiddleware = require("../http/middleware/authMiddleware");

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.put("/:id", Controller.update);

module.exports = router;

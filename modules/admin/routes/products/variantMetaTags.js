const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductMetaController");
const requirePermission = require("../../http/middleware/requirePermission");

router.use(requirePermission("products"));

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.put("/:id", Controller.update);

module.exports = router;

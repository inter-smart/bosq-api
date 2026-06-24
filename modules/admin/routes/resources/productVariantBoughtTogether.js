const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductVariantBoughtTogetherController");
const requirePermission = require("../../http/middleware/requirePermission");

router.use(requirePermission("products"));

router.get("/:variantId", Controller.index);
router.post("/:variantId/sync", Controller.sync);

module.exports = router;

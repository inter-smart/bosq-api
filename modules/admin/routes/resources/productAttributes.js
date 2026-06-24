const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductAttributeController");
const requirePermission = require("../../http/middleware/requirePermission.js");
router.use(requirePermission("products"));
router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", Controller.store);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

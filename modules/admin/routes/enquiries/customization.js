const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/enquiries/CustomizationFormController");
const authMiddleware = require("../../http/middleware/authMiddleware");
const requirePermission = require("../../http/middleware/requirePermission");

// router.use(authMiddleware(["admin"]));
router.use(requirePermission("enquiries"));

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.delete("/:id", Controller.destroy);

module.exports = router;

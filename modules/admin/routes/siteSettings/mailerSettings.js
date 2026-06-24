const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/siteSettings/mailerSettingsController.js");
const requirePermission = require("../../http/middleware/requirePermission.js");
const { validateType, validateUpdate } = require("../../http/request/siteSettings/mailerSettingsRequest.js");

router.use(requirePermission("settings"));
router.get("/", Controller.index);
router.put("/:type", validateType, validateUpdate, Controller.update);

module.exports = router;

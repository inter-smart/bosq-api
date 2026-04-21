const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/siteSettings/mailerSettingsController.js");
const authMiddleware = require("../../http/middleware/authMiddleware.js");
const { validateType, validateUpdate } = require("../../http/request/siteSettings/mailerSettingsRequest.js");

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.put("/:type", validateType, validateUpdate, Controller.update);

module.exports = router;

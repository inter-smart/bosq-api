const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/policy/privacyPolicy/PolicyCmsController.js");
const requirePermission = require("../../../http/middleware/requirePermission.js");
router.use(requirePermission("policies"));
router.get("/", Controller.index);
router.post("/", Controller.update);

module.exports = router;

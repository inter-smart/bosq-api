const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/users/usersController.js");
const requirePermission = require("../../http/middleware/requirePermission.js");

router.use(requirePermission("users"));

// Read-only routes
router.get("/", Controller.index);
router.get("/:id", Controller.show);

module.exports = router;
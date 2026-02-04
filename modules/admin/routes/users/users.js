const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/users/usersController.js");

// Read-only routes
router.get("/", Controller.index);
router.get("/:id", Controller.show);

module.exports = router;
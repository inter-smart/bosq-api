const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/AboutController.js");

router.get("/", Controller.index);

module.exports = router;

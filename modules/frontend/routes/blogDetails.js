const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/BlogController.js");

router.get("/", Controller.show);
module.exports = router;

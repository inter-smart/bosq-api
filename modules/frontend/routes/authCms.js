const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/AuthCmsController.js");

router.get("/", Controller.index);

module.exports = router;

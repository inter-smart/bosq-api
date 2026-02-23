const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/BlogController.js");

router.get("/", Controller.show);
router.post("/view", Controller.incrementView);
module.exports = router;

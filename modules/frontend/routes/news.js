const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/NewsController.js");

router.get("/", Controller.index);
router.get("/news-list", Controller.getNews);
module.exports = router;
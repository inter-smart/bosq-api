const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/BlogController.js");

router.get("/", Controller.index);
router.get("/blog-list", Controller.getBlogs);
module.exports = router;

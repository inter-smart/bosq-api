const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/PolicyContoller");



router.get("/:slug", Controller.index);


module.exports = router;

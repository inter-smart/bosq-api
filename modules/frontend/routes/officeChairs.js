const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/OfficeChairsController.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");

router.get("/", optionalAuth(), cartContext, Controller.index);

module.exports = router;

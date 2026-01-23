const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/CommonActionsController");

router.get("/listing/filters", Controller.getLisitngFilters);

module.exports = router;

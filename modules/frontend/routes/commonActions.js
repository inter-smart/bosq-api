const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/CommonActionsController");

router.get("/listing/filters", Controller.getLisitngFilters);
router.get("/product/choose-design", Controller.chooseDesignFilters);
router.get("/product-search/categories", Controller.productSearchCategories);

module.exports = router;

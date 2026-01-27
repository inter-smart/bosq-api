const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/products/ProductsController.js");

router.get("/product-slug", Controller.getProductBySlug);
router.get("/product-listing", Controller.getProductListing);
module.exports = router;

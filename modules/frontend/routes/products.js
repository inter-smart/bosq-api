const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/products/ProductsController.js");

router.get("/product", Controller.getProductBySlug);
router.get("/product-model", Controller.getProductModelData);
router.get("/product-listing", Controller.getProductListing);
router.get("/initial-product-list", Controller.getInitialProductList);
module.exports = router;

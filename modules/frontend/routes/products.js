const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/products/ProductsController.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");

router.get("/product", Controller.getProductBySlug);
router.get("/product-model", Controller.getProductModelData);
router.get("/product-listing", optionalAuth(), cartContext, Controller.getInitialProductList);
router.get("/initial-product-list", Controller.getInitialProductList);
router.get("/product-search", Controller.productSearchList);
router.get("/product-search-by-keywords", Controller.productSearchListByKeywords);
module.exports = router;

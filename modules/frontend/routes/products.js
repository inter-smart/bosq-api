const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/products/ProductsController.js");
const { optionalAuth } = require("../http/middleware/optionalAuthMiddleware.js");
const { cartContext } = require("../http/middleware/cartMiddleware.js");
const MetaTagController = require("../http/controllers/MetaTagContoller");
router.get("/product-meta", (req, res) => {
  MetaTagController.getProductMetaBySlug(req, res);
});
router.get("/product", optionalAuth(), cartContext, Controller.getProductBySlug);
router.get("/product-model", Controller.getProductModelData);
router.get("/product-listing", optionalAuth(), cartContext, Controller.getProductListing);
router.get("/product-search", Controller.productSearchList);
router.get("/product-search-by-keywords", Controller.productSearchListByKeywords);
module.exports = router;

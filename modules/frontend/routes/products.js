const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/products/ProductsController.js");

router.get("/product", Controller.getProductBySlug);
router.get("/product-model", Controller.getProductModelData);
module.exports = router;

const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/CouponsController.js");
const authMiddleware = require("../http/middleware/authMiddleware");
const { createUploadMiddleware } = require("../http/middleware/multerMiddleware.js");


const fields = [
    { name: "media_path", maxCount: 1 },
];

const upload = createUploadMiddleware("coupons", fields);
router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.get("/product-category", Controller.getAllProductCategories);

router.get("/product/:id", Controller.getAllProducts);
router.get("/product-model/:id", Controller.getAllProductModels);
router.get("/product-variant/:id", Controller.getAllProductVariants);

router.get("/:id", Controller.show);
router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);

module.exports = router;

const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/langinPage/ProductTypeController.js");
const { createUploadMiddleware } = require("../http/middleware/multerMiddleware.js");
const authMiddleware = require("../http/middleware/authMiddleware.js");
// Define upload fields
const fields = [
    { name: "media_path", maxCount: 1 },
];


// Create upload middleware with fields
const upload = createUploadMiddleware("product-type", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.get("/product-category", Controller.getAllProductCategories);
router.get("/variants-by-category/:id", Controller.getVariantsByCategory);

router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductCategoryController");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware");
const authMiddleware = require("../../http/middleware/authMiddleware");
// Define upload fields
const fields = [{ name: "media_path", maxCount: 1 }];

// Create upload middleware with fields
const upload = createUploadMiddleware("product-categories", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.get("/parents", Controller.getParentCategories);
router.get("/active", Controller.getActiveCategories);

router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductVariantsController");
const authMiddleware = require("../../http/middleware/authMiddleware");
const {
  createUploadMiddleware,
} = require("../../http/middleware/multerMiddleware");

router.use(authMiddleware(["admin"]));

// Define upload fields
const fields = [
  { name: "media_path", maxCount: 1 },
  { name: "hover_media_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("product-variant", fields);

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

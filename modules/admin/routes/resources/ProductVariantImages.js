const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductVariantImagesController");
const authMiddleware = require("../../http/middleware/authMiddleware");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware");

const uploadMiddleware = createUploadMiddleware("product-variant-images", [
  { name: "images", maxCount: 10 },
  { name: "thumbnail", maxCount: 10 },
]);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", uploadMiddleware, Controller.store);
router.put("/:id", uploadMiddleware, Controller.update);
router.delete("/all", Controller.destroyAll);
router.delete("/:id", Controller.destroy);

module.exports = router;

const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductBaseController");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware");
const requirePermission = require("../../http/middleware/requirePermission.js");
// Define upload fields
const fields = [
  { name: "media_path", maxCount: 1 },
  { name: "brochure", maxCount: 1 },
];

router.use(requirePermission("products"));
// Create upload middleware with fields
const upload = createUploadMiddleware("product-base", fields);

router.get("/", Controller.index);
router.get("/export", Controller.export);
router.get("/:id", Controller.show);

// Protected routes (require admin auth)
router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/all", Controller.destroyAll);
router.delete("/:id", Controller.destroy);

module.exports = router;

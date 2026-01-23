const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductModelsController");
const authMiddleware = require("../../http/middleware/authMiddleware");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware");

const fields = [{ name: "media_path", maxCount: 1 }];
const upload = createUploadMiddleware("product-models", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.get("/product/:id", Controller.getByProductId);
router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

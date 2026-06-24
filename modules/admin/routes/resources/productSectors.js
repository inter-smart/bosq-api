const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/resources/product/ProductSectorsController");
const requirePermission = require("../../http/middleware/requirePermission.js");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware");

const fields = [{ name: "media_path", maxCount: 1 }];
const upload = createUploadMiddleware("product-sectors", fields);

router.use(requirePermission("products"));
router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

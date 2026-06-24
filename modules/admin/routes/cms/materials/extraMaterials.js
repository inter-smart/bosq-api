const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/materials/ExtraMaterialController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const requirePermission = require("../../../http/middleware/requirePermission.js");
// Define upload fields
const fields = [{ name: "media_path", maxCount: 1, name: "icon_path", maxCount: 1 }];

// Create upload middleware with fields
const upload = createUploadMiddleware("extra-materials", fields);

router.use(requirePermission("cms"));
router.get("/", Controller.index);

router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

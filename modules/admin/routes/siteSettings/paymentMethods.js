const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/siteSettings/paymentMethodsController.js");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware.js");
const requirePermission = require("../../http/middleware/requirePermission.js");
// Define upload fields
const fields = [{ name: "icon_media_path", maxCount: 1 }];

router.use(requirePermission("settings"));

// Create upload middleware with fields
const upload = createUploadMiddleware("payment-method", fields);

router.get("/", Controller.index);

router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

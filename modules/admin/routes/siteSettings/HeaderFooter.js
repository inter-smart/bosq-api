const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/siteSettings/HeaderFooterController.js");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware.js");
const requirePermission = require("../../http/middleware/requirePermission.js");
// Define upload fields
const fields = [
  { name: "header_logo_media_path", maxCount: 1 },
  { name: "footer_logo_media_path", maxCount: 1 },
];

router.use(requirePermission("settings"));
// Create upload middleware with fields
const upload = createUploadMiddleware("header-footer", fields);

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;

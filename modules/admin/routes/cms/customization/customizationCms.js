const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/customization/CustomizationCmsController");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");

// Define upload fields
const fields = [
  { name: "banner_media_desktop_path", maxCount: 1 },
  { name: "banner_media_mobile_path", maxCount: 1 },
  { name: "process_media_path", maxCount: 1 },
  { name: "form_media_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("customization-cms", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;

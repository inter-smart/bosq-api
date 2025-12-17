const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/ergnomicGuide/CmsController");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");

// Define upload fields
const fields = [
  { name: "media_desktop_path", maxCount: 1 },
  { name: "media_mobile_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("ergnomic-guide-cms", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;

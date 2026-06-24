const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/materials/MaterialsCmsController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const requirePermission = require("../../../http/middleware/requirePermission.js");
// Define upload fields
// Define fields
const fields = [
    { name: "banner_media_desktop_path", maxCount: 1 },
    { name: "banner_media_mobile_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("material-cms", fields);

router.use(requirePermission("cms"));
router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;
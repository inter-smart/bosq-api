const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/about/AboutCmsController.js");
const {
  createUploadMiddleware,
} = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");

// Define upload fields
const fields = [
  { name: "banner_media_desktop_path", maxCount: 1 },
  { name: "banner_media_mobile_path", maxCount: 1 },
  { name: "banner_video_thumbnail_path", maxCount: 1 },
  { name: "banner_media_desktop_path_ar", maxCount: 1 },
  { name: "banner_media_mobile_path_ar", maxCount: 1 },
  { name: "journey_one_media_path", maxCount: 1 },
  { name: "journey_two_media_path", maxCount: 1 },
  { name: "journey_three_media_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("about-cms", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;

const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/projects/ProjectsController.js");
const {
  createUploadMiddleware,
} = require("../../http/middleware/multerMiddleware.js");
const authMiddleware = require("../../http/middleware/authMiddleware.js");
// Define upload fields
const fields = [
  { name: "thumbnail", maxCount: 1 },
  { name: "section1_desktop_media_path", maxCount: 1 },
  { name: "section1_mobile_media_path", maxCount: 1 },
  { name: "section2_first_media_path", maxCount: 1 },
  { name: "section2_second_media_path", maxCount: 1 },
  { name: "section3_media_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("projects", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);

router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

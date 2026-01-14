const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/auth/cmsController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");

// Define upload fields
const fields = [
  { name: "signup_media_desktop_path", maxCount: 1 },
  { name: "login_media_desktop_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("auth-cms", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;

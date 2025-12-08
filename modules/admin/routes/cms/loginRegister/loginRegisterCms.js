const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/loginRegister/loginRegisterCmsController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");

// Define upload fields
const fields = [
  { name: "signup_media_path", maxCount: 1 },
  { name: "otp_media_path", maxCount: 1 },
  { name: "your_password_media_path", maxCount: 1 },
  { name: "login_media_path", maxCount: 1 },
  { name: "recover_email_media_path", maxCount: 1 },
  { name: "recover_password_media_path", maxCount: 1 },
  { name: "new_password_media_path", maxCount: 1 },
];


// Create upload middleware with fields
const upload = createUploadMiddleware("login-register", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;
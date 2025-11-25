const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/home/HomeCmsController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");
// Define upload fields
// Define fields
const fields = [
    { name: "about_media_path", maxCount: 1 },
    { name: "journy_media_path", maxCount: 1 },
    { name: "calculator_media_path", maxCount: 1 },
    { name: "customize_media_path", maxCount: 1 },
    { name: "form_media_path", maxCount: 1 },
];

// Create upload middleware with fields
const upload = createUploadMiddleware("home-cms", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;
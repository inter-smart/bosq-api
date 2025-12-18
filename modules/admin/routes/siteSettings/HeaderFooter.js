const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/siteSettings/HeaderFooterController.js");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware.js");
const authMiddleware = require("../../http/middleware/authMiddleware.js");

// Define upload fields
const fields = [
    { name: "header_logo_media_path", maxCount: 1 },
    { name: "footer_logo_media_path", maxCount: 1 },
];


// Create upload middleware with fields
const upload = createUploadMiddleware("header-footer", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;
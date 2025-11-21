const express = require("express");
const router = express.Router();
const authMiddleware = require('../../http/middleware/authMiddleware');
const Controller = require("../../http/controllers/contact/contactCmsController.js");
const { createUploadMiddleware } = require("../../http/middleware/multerMiddleware.js");

// Define upload fields
const fields = [
    { name: "media_path", maxCount: 1 },
];


// Create upload middleware with fields
const upload = createUploadMiddleware("contact-cms", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;

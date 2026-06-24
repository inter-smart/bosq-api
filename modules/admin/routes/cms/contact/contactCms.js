const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/contact/ContactCmsController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const requirePermission = require("../../../http/middleware/requirePermission.js");
// Define upload fields
const fields = [
    { name: "media_path", maxCount: 1 },
];


// Create upload middleware with fields
const upload = createUploadMiddleware("contact-cms", fields);

router.use(requirePermission("cms"));
router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;

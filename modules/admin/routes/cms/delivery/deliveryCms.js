const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/delivery/DeliveryCmsController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware.js");
const authMiddleware = require("../../../http/middleware/authMiddleware.js");

// Define upload fields
const fields = [
    { name: "banner_media_desktop_path", maxCount: 1 },
    { name: "banner_media_mobile_path", maxCount: 1 },
    {name: "delivery_media_path", maxCount: 1},
];

// Create upload middleware with fields
const upload = createUploadMiddleware("delivery-cms", fields);

router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", upload, Controller.update);

module.exports = router;
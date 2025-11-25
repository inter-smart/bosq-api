const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/home/HomeBannerController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");
// Define upload fields
const fields = [
    { name: "media_desktop_path", maxCount: 1 },
    { name: "media_mobile_path", maxCount: 1 },
];


// Create upload middleware with fields
const upload = createUploadMiddleware("home-banner", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);


router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

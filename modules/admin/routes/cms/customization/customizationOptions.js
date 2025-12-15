const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/customization/CustomizationOptionsController");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");

// Define upload fields
const fields = [{ name: "media_path", maxCount: 1 }];

// Create upload middleware with fields
const upload = createUploadMiddleware("customization-features", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);

router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", Controller.store);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

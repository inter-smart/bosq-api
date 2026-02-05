const express = require("express");
const router = express.Router();
const Controller = require("../../http/controllers/projects/ProjectImagesController.js");
const {
  createUploadMiddleware,
} = require("../../http/middleware/multerMiddleware.js");
const authMiddleware = require("../../http/middleware/authMiddleware.js");
// Define upload fields
const fields = [{ name: "media_path", maxCount: 1 }];

// Create upload middleware with fields
const upload = createUploadMiddleware("projects", fields);

// router.use(authMiddleware(["admin"]));
router.get("/", Controller.index);
router.get("/:id", Controller.show);
router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

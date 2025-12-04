const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/about/aboutJourneysController");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware");
const authMiddleware = require("../../../http/middleware/authMiddleware");
// Define upload fields
const fields = [];


// Create upload middleware with fields
const upload = createUploadMiddleware("about-journeys", fields);

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);


router.get("/:id", Controller.show);

// Protected routes (require admin auth)

router.post("/", upload, Controller.store);
router.put("/:id", upload, Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;

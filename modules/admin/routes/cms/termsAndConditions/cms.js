const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/cms/termsAndConditions/TermsAndConditionsCmsController.js");
const { createUploadMiddleware } = require("../../../http/middleware/multerMiddleware.js");
const authMiddleware = require("../../../http/middleware/authMiddleware.js");

// Create upload middleware with fields

// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", Controller.update);

module.exports = router;
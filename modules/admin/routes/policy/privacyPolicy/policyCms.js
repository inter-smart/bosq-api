const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/policy/privacyPolicy/PolicyCmsController.js");
const authMiddleware = require("../../../http/middleware/authMiddleware.js");



router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", Controller.update);

module.exports = router;

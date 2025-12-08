const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/policy/privacyPolicy/policyCmsController.js");



// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", Controller.update);

module.exports = router;

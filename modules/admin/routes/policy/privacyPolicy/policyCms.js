const express = require("express");
const router = express.Router();
const Controller = require("../../../http/controllers/policy/privacyPolicy/PolicyCmsController.js");



// router.use(authMiddleware(["admin"]));

router.get("/", Controller.index);
router.post("/", Controller.update);

module.exports = router;

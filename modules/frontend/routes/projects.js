const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/ProjectController.js");

router.get("/", Controller.index);
router.get("/project-list", Controller.getProjectsBySlug);
router.get("/project-details", Controller.show);
module.exports = router;

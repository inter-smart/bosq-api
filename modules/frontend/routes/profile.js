const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/userController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");




router.use(verifyToken())
router.get("/my-profile", Controller.getProfileData);
router.put("/edit-profile", Controller.editProfile);


module.exports = router;
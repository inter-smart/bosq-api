const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/userController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");

router.post("/logout", Controller.logout);

router.use(verifyToken());
router.get("/my-profile", Controller.getProfileData);
router.put("/edit-profile", Controller.editProfile);
router.get("/fetch-profile-by-id", Controller.fetchProfileById);
router.put("/change-password", Controller.changePassword);

module.exports = router;

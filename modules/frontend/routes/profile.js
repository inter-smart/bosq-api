const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/userController.js");
const { verifyToken } = require("../http/middleware/authMiddleware.js");
const {
  personalInfoRequestPost,
  changePasswordRequestPost,
} = require("../http/request/profileRequest.js");

router.use(verifyToken());
router.get("/my-profile", Controller.getProfileData);
router.put("/edit-profile", personalInfoRequestPost, Controller.editProfile);

router.put(
  "/change-password",
  changePasswordRequestPost,
  Controller.changePassword,
);

module.exports = router;

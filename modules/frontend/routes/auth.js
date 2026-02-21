const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/auth/authController.js");
const { verifyTempToken } = require("../http/middleware/authMiddleware.js");

router.post("/register", Controller.register);
router.post("/verify-otp", Controller.verifyOtp);
router.post("/create-password", verifyTempToken, Controller.createPassword);

router.post("/login", Controller.login);
router.post("/google-login", Controller.googleLogin);
router.post("/forgot-password", Controller.forgotPassword)
router.post("/verify-reset-password-otp",Controller.verifyForgotPasswordOtp)
router.post("/reset-password",verifyTempToken, Controller.createNewPassword)
module.exports = router;
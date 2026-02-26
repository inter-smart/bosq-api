const express = require("express");
const router = express.Router();
const Controller = require("../http/controllers/auth/authController.js");
const { verifyTempToken } = require("../http/middleware/authMiddleware.js");
const {
  validateRegisterRequest,
  verifyOtpValidation,
  createPasswordRequest,
  loginRequest,
  forgotPasswordRequest,
  handleValidationErrors,
} = require("../http/request/authRequest.js");

router.post("/register", validateRegisterRequest, handleValidationErrors, Controller.register);
router.post("/verify-otp", verifyOtpValidation, handleValidationErrors, Controller.verifyOtp);
router.post("/create-password", verifyTempToken, createPasswordRequest, handleValidationErrors, Controller.createPassword);

router.post("/login", loginRequest, handleValidationErrors, Controller.login);
router.post("/google-login", Controller.googleLogin);
router.post("/forgot-password", forgotPasswordRequest, handleValidationErrors, Controller.forgotPassword);
router.post("/verify-reset-password-otp", verifyOtpValidation, handleValidationErrors, Controller.verifyForgotPasswordOtp);
router.post("/reset-password", verifyTempToken, createPasswordRequest, handleValidationErrors, Controller.createNewPassword);

module.exports = router;

const express = require('express');
const router = express.Router();
const requireAuth = require("../../http/middleware/requireAuth.js");
const Controller = require('../../http/controllers/AuthController');
const { validatePasswordResetRequest, validatePasswordReset, validateResendOtp, validateVerifyOtp, validateResetPassword } = require('../../http/request/auth/AuthRequest');


router.post('/login', Controller.login);

// Password reset routes (public - no auth required)
router.post("/request-password-reset", validatePasswordResetRequest, Controller.requestPasswordReset);
router.post(
  "/verify-reset-otp",
  validateVerifyOtp,
  Controller.verifyResetOtp
);

router.post(
  "/reset-password",
  validateResetPassword,
  Controller.resetPassword
);
router.post("/resend-otp", validateResendOtp, Controller.resendOtp);



router.use(requireAuth());
router.get('/me', Controller.me);
// router.post('/logout', Controller.logout);


module.exports = router;
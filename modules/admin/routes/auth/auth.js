const express = require('express');
const router = express.Router();
const authMiddleware = require('../../http/middleware/authMiddleware');
const Controller = require('../../http/controllers/AuthController');
const { validatePasswordResetRequest, validatePasswordReset, validateResendOtp, validateVerifyOtp, validateResetPassword } = require('../../http/request/auth/AuthRequest');


router.post('/register', Controller.register);
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



router.use(authMiddleware(['admin']));
// router.post('/logout', Controller.logout);


module.exports = router;
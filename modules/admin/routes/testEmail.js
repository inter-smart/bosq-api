const express = require("express");
const router = express.Router();
const EmailService = require("../../../services/EmailService");

router.post("/", async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to) {
    return res.status(400).json({ success: false, message: '"to" is required' });
  }

  const data = {
    first_name: "Afsal",
    otp: 45768,
    expiry_minutes: "10",
    year: new Date().getFullYear(),
  };

  try {
    const result = await EmailService.sendNewsletterConfirmation(to);
    return res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

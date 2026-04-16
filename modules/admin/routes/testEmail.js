const express = require("express");
const router = express.Router();
const EmailService = require("../../../services/EmailService");

router.post("/", async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to) {
    return res.status(400).json({ success: false, message: "\"to\" is required" });
  }

  try {
    const result = await EmailService.sendEmail({
      to,
      subject: subject || "Test Email",
      html: html || "<p>This is a test email from BOSQ.</p>",
    });

    return res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

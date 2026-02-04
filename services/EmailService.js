const nodemailer = require("nodemailer");

class EmailService {
  static transporter = null;

  /**
   * Get or create nodemailer transporter (lazy initialization)
   */
  static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} [options.text] - Plain text content (optional)
   */
  static async sendEmail({ to, subject, html, text }) {
    const transporter = this.getTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * Send password reset OTP email
   * @param {string} email - Recipient email
   * @param {Object} data - Template data
   * @param {string} data.first_name - User's name
   * @param {string} data.otp - 6-digit OTP
   * @param {string} data.expiry_minutes - OTP validity in minutes
   * @param {number} data.year - Current year
   */
  static async sendPasswordResetEmail(email, data) {
    const html = this.getPasswordResetTemplate(data);

    return this.sendEmail({
      to: email,
      subject: `${data.otp} is your password reset code`,
      html,
    });
  }

  /**
   * Generate password reset email HTML template
   * @param {Object} data - Template data
   */
  static getPasswordResetTemplate(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">BOSQ</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Password Reset Request</h2>

              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                Hi ${data.first_name},
              </p>

              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Use the verification code below to complete the process:
              </p>

              <!-- OTP Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 20px 40px; background-color: #f8f9fa; border: 2px dashed #1a1a2e; border-radius: 8px;">
                      <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">${data.otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>${data.expiry_minutes} minutes</strong>.
              </p>

              <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>

              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">

              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                For security reasons, never share this code with anyone. Our team will never ask you for this code.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                &copy; ${data.year} BOSQ. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }




  /**
   * Send an OTP to a user
   * @param {Object} options - OTP sending options
   * @param {string} options.to - Recipient email
   * @param {string} options.otp - 6-digit OTP
   */
static async sendOtp(to, otp) {
    const transporter = this.getTransporter();

    return transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${
        process.env.EMAIL_FROM || process.env.SMTP_USER
      }>`,
      to,
      subject: "Your OTP for Registration",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 3px;">${otp}</h1>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  }

}

module.exports = EmailService;

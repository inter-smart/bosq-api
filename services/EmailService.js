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
      from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER
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

  // For contact enquiry
  static async sendContactEnquiry(data) {
    const transporter = this.getTransporter();

    return transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: data.email,
      subject: "Thank You For Your Enquiry – BOSQ",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Thank You For Your Enquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Outer Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- ── HEADER ── -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <!-- Icon box -->
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── HERO TITLE ── -->
          <tr>
            <td align="center" style="padding:48px 50px 12px;">
              <h1 style="margin:0;font-size:30px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;letter-spacing:0.5px;line-height:1.3;">
                Thank You For Your Enquiry
              </h1>
            </td>
          </tr>

          <!-- ── GREETING & INTRO ── -->
          <tr>
            <td style="padding:20px 50px 28px;">
              <p style="margin:0 0 14px;font-size:15px;color:#444444;line-height:1.7;font-family:Georgia,serif;">
                Dear ${data.name},
              </p>
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.8;font-family:Arial,sans-serif;">
                We have received your enquiry and appreciate your interest in Bosq. Our seating specialists are reviewing your requirements and will provide personalised recommendations for your workspace needs.
              </p>
            </td>
          </tr>

          <!-- ── ENQUIRY SUMMARY BOX ── -->
          <tr>
            <td style="padding:0 50px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;border:1px solid #e8e3db;border-radius:3px;">
                <tr>
                  <td style="padding:20px 24px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      Your Enquiry
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 24px 20px;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.75;font-family:Arial,sans-serif;">
                      ${data.message}
                    </p>
                  </td>
                </tr>
                ${data.phone
          ? `
                <tr>
                  <td style="padding:0 24px 16px;">
                    <p style="margin:0;font-size:12px;color:#999999;font-family:Arial,sans-serif;">
                      📞 ${data.phone}
                    </p>
                  </td>
                </tr>`
          : ""
        }
              </table>
            </td>
          </tr>

          <!-- ── WHAT HAPPENS NEXT ── -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td style="padding:24px 28px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      What Happens Next?
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 20px;">
                    <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      Our Bosq seating expert will contact you within 24 hours with tailored chair recommendations, pricing, and bulk order options for your workspace.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 28px 28px;">
                    <a href="mailto:${process.env.EMAIL_FROM || ""}" style="display:inline-block;padding:12px 36px;background-color:#ffffff;color:#1c1c1c;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                      Contact Us
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CONTACT INFO ── -->
          <tr>
            <td align="center" style="padding:0 50px 32px;">
              <p style="margin:0;font-size:12px;color:#888888;line-height:1.8;font-family:Arial,sans-serif;">
                For immediate assistance with office chair selection,<br/>
                call us at <a href="tel:+97156103637" style="color:#c9a96e;text-decoration:none;">+971 56 103 637</a>&nbsp; or email&nbsp;<a href="mailto:sales@bosq.ae" style="color:#c9a96e;text-decoration:none;">sales@bosq.ae</a>
              </p>
            </td>
          </tr>

          <!-- ── SOCIAL ICONS ── -->
          <tr>
            <td align="center" style="padding:0 50px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Facebook -->
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:13px;font-weight:700;font-family:Arial,sans-serif;">f</span>
                    </a>
                  </td>
                  <!-- Instagram -->
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:11px;font-family:Arial,sans-serif;">&#9679;</span>
                    </a>
                  </td>
                  <!-- LinkedIn -->
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">in</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Outer Card -->

      </td>
    </tr>
  </table>

</body>
</html>
    `.trim(),
    });
  }

  static async sendContactEnquiryAdmin(data) {
    const transporter = this.getTransporter();

    return transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New ${data.type.capitalize()} Enquiry – ${data.name}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Contact Enquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- ── HEADER ── -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                    <div style="font-size:10px;color:#999999;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">organic living</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── ALERT BADGE ── -->
          <tr>
            <td align="center" style="padding:36px 50px 8px;">
              <div style="display:inline-block;background-color:#fff4e0;border:1px solid #c9a96e;border-radius:20px;padding:6px 18px;">
                <span style="font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                  ● New Enquiry Received
                </span>
              </div>
            </td>
          </tr>

          <!-- ── TITLE ── -->
          <tr>
            <td align="center" style="padding:16px 50px 8px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;letter-spacing:0.5px;line-height:1.3;">
                New Contact Enquiry
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:#999999;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                ${new Date().toLocaleString("en-AE", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr>
            <td style="padding:24px 50px 0;">
              <hr style="border:none;border-top:1px solid #e8e3db;margin:0;" />
            </td>
          </tr>

          <!-- ── CONTACT DETAILS ── -->
          <tr>
            <td style="padding:28px 50px 8px;">
              <p style="margin:0 0 18px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Contact Details
              </p>

              <!-- Name -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td width="130" style="vertical-align:top;padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">Name</span>
                  </td>
                  <td style="vertical-align:top;padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.name}</span>
                  </td>
                </tr>
              </table>

              <!-- Email -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td width="130" style="vertical-align:top;padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">Email</span>
                  </td>
                  <td style="vertical-align:top;padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <a href="mailto:${data.email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.email}</a>
                  </td>
                </tr>
              </table>

              <!-- Phone -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td width="130" style="vertical-align:top;padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">Phone</span>
                  </td>
                  <td style="vertical-align:top;padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    ${data.phone
          ? `<a href="tel:${data.phone}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.phone}</a>`
          : `<span style="font-size:14px;color:#bbbbbb;font-family:Arial,sans-serif;font-style:italic;">Not provided</span>`
        }
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── MESSAGE BOX ── -->
          <tr>
            <td style="padding:8px 50px 36px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Message
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;background-color:#f7f5f2;border-left:3px solid #c9a96e;border-radius:0 3px 3px 0;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.85;font-family:Arial,sans-serif;">
                      ${data.message}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CTA BLOCK ── -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td style="padding:24px 28px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      Action Required
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 20px;">
                    <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      Please follow up with this customer within <strong style="color:#ffffff;">24 hours</strong> to provide tailored recommendations and pricing.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 28px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <a href="mailto:${data.email}" style="display:inline-block;padding:11px 28px;background-color:#c9a96e;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                            Reply to Customer
                          </a>
                        </td>
                        ${data.phone
          ? `
                        <td>
                          <a href="tel:${data.phone}" style="display:inline-block;padding:11px 28px;background-color:transparent;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;border:1px solid #555555;font-family:Arial,sans-serif;">
                            Call Customer
                          </a>
                        </td>`
          : ""
        }
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved. &nbsp;|&nbsp; Internal Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `.trim(),
    });
  }


  // ─────────────────────────────────────────────
//  CUSTOMIZATION ENQUIRY — User Confirmation
// ─────────────────────────────────────────────
static async sendCustomizationEnquiry(data) {
  const transporter = this.getTransporter();

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: data.email,
    subject: "We've Received Your Customization Enquiry – BOSQ",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Customization Enquiry Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                    <div style="font-size:10px;color:#999999;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">organic living</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO TITLE -->
          <tr>
            <td align="center" style="padding:44px 50px 12px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;letter-spacing:0.5px;line-height:1.3;">
                Thank You For Your Enquiry
              </h1>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:20px 50px 28px;">
              <p style="margin:0 0 14px;font-size:15px;color:#444444;line-height:1.7;font-family:Georgia,serif;">
                Dear ${data.first_name} ${data.last_name},
              </p>
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.85;font-family:Arial,sans-serif;">
                We have received your customization enquiry and appreciate your interest in BOSQ. 
                Our specialists are reviewing your requirements and will provide personalised 
                recommendations tailored to your needs.
              </p>
            </td>
          </tr>

          <!-- ENQUIRY SUMMARY -->
          <tr>
            <td style="padding:0 50px 32px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Your Enquiry Summary
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;border:1px solid #e8e3db;border-radius:3px;">

                <!-- Full Name -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Full Name</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.first_name} ${data.last_name}</span>
                  </td>
                </tr>

                ${data.company_name ? `
                <!-- Company -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Company</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.company_name}</span>
                  </td>
                </tr>` : ""}

                <!-- Help Option -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Help Required</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.option_label || "Customization Request"}</span>
                  </td>
                </tr>

                ${data.state_label ? `
                <!-- State -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">State</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.state_label}</span>
                  </td>
                </tr>` : ""}

                <!-- Message -->
                <tr>
                  <td width="160" style="padding:12px 18px;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Message</span>
                  </td>
                  <td style="padding:12px 18px;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#444444;line-height:1.75;font-family:Arial,sans-serif;">${data.message}</span>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- WHAT HAPPENS NEXT -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td style="padding:24px 28px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      What Happens Next?
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 20px;">
                    <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      Our BOSQ customization expert will contact you within <strong style="color:#ffffff;">24 hours</strong> with 
                      tailored recommendations, pricing, and available options for your specific requirements.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 28px 28px;">
                    <a href="mailto:${process.env.EMAIL_FROM || ""}" style="display:inline-block;padding:12px 36px;background-color:#ffffff;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                      Contact Us
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTACT INFO -->
          <tr>
            <td align="center" style="padding:0 50px 28px;">
              <p style="margin:0;font-size:12px;color:#888888;line-height:1.8;font-family:Arial,sans-serif;">
                For immediate assistance, call us at 
                <a href="tel:+97156103637" style="color:#c9a96e;text-decoration:none;">+971 56 103 637</a>
                &nbsp;or email&nbsp;
                <a href="mailto:sales@bosq.ae" style="color:#c9a96e;text-decoration:none;">sales@bosq.ae</a>
              </p>
            </td>
          </tr>

          <!-- SOCIAL -->
          <tr>
            <td align="center" style="padding:0 50px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:13px;font-weight:700;font-family:Arial,sans-serif;">f</span>
                    </a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:11px;font-family:Arial,sans-serif;">&#9679;</span>
                    </a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">in</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}


// ─────────────────────────────────────────────
//  CUSTOMIZATION ENQUIRY — Admin Notification
// ─────────────────────────────────────────────
static async sendCustomizationEnquiryAdmin(data) {
  const transporter = this.getTransporter();

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Customization Enquiry – ${data.first_name} ${data.last_name}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Customization Enquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                    <div style="font-size:10px;color:#999999;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">organic living</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ALERT BADGE -->
          <tr>
            <td align="center" style="padding:36px 50px 8px;">
              <div style="display:inline-block;background-color:#fff4e0;border:1px solid #c9a96e;border-radius:20px;padding:6px 18px;">
                <span style="font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                  ● New Customization Enquiry
                </span>
              </div>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td align="center" style="padding:16px 50px 8px;">
              <h1 style="margin:0;font-size:26px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;line-height:1.3;">
                New Customization Enquiry
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:#999999;font-family:Arial,sans-serif;">
                ${new Date().toLocaleString("en-AE", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:24px 50px 0;">
              <hr style="border:none;border-top:1px solid #e8e3db;margin:0;"/>
            </td>
          </tr>

          <!-- CONTACT DETAILS -->
          <tr>
            <td style="padding:28px 50px 8px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Contact Details
              </p>

              <!-- Name Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Full Name</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.first_name} ${data.last_name}</span>
                  </td>
                </tr>
              </table>

              ${data.company_name ? `
              <!-- Company Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Company</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.company_name}</span>
                  </td>
                </tr>
              </table>` : ""}

              <!-- Email Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Email</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <a href="mailto:${data.email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.email}</a>
                  </td>
                </tr>
              </table>

              <!-- Phone Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Phone</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    ${data.phone
                      ? `<a href="tel:${data.phone}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.phone}</a>`
                      : `<span style="font-size:14px;color:#bbbbbb;font-family:Arial,sans-serif;font-style:italic;">Not provided</span>`
                    }
                  </td>
                </tr>
              </table>

              <!-- Option Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Help With</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #c9a96e;">
                    <span style="font-size:14px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.option_label || `Option ID: ${data.options_id}`}</span>
                  </td>
                </tr>
              </table>

              ${data.state_label ? `
              <!-- State Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">State</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.state_label}</span>
                  </td>
                </tr>
              </table>` : ""}

            </td>
          </tr>

          <!-- MESSAGE BOX -->
          <tr>
            <td style="padding:8px 50px 36px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Message
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;background-color:#f7f5f2;border-left:3px solid #c9a96e;border-radius:0 3px 3px 0;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.85;font-family:Arial,sans-serif;">
                      ${data.message}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ACTION BLOCK -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td style="padding:24px 28px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      Action Required
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 20px;">
                    <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      Please follow up with this customer within <strong style="color:#ffffff;">24 hours</strong> to provide 
                      tailored customization recommendations and pricing.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 28px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <a href="mailto:${data.email}" style="display:inline-block;padding:11px 28px;background-color:#c9a96e;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                            Reply to Customer
                          </a>
                        </td>
                        ${data.phone ? `
                        <td>
                          <a href="tel:${data.phone}" style="display:inline-block;padding:11px 28px;background-color:transparent;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;border:1px solid #555555;font-family:Arial,sans-serif;">
                            Call Customer
                          </a>
                        </td>` : ""}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved. &nbsp;|&nbsp; Internal Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

// ─────────────────────────────────────────────
//  NEWSLETTER — User Confirmation
// ─────────────────────────────────────────────
static async sendNewsletterConfirmation(email) {
  const transporter = this.getTransporter();

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "You're Now Subscribed – BOSQ Newsletter",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Newsletter Subscription Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                    <div style="font-size:10px;color:#999999;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">organic living</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO ICON -->
          <tr>
            <td align="center" style="padding:44px 50px 8px;">
              <div style="display:inline-block;width:64px;height:64px;background-color:#f7f5f2;border:2px solid #c9a96e;border-radius:50%;text-align:center;line-height:64px;">
                <span style="font-size:26px;">✉</span>
              </div>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td align="center" style="padding:20px 50px 12px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;letter-spacing:0.5px;line-height:1.3;">
                You're Subscribed!
              </h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td align="center" style="padding:8px 60px 36px;">
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.9;font-family:Arial,sans-serif;text-align:center;">
                Welcome to the BOSQ community. You'll be the first to hear about our 
                latest collections, exclusive offers, design inspiration, and workspace 
                solutions delivered straight to your inbox.
              </p>
            </td>
          </tr>

          <!-- DIVIDER WITH LABEL -->
          <tr>
            <td style="padding:0 50px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e8e3db;width:40%;"></td>
                  <td align="center" style="padding:0 16px;white-space:nowrap;">
                    <span style="font-size:10px;color:#c9a96e;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">What to expect</span>
                  </td>
                  <td style="border-top:1px solid #e8e3db;width:40%;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PERKS -->
          <tr>
            <td style="padding:28px 50px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Perk 1 -->
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ede8;vertical-align:top;" width="36">
                    <div style="width:28px;height:28px;background-color:#1c1c1c;border-radius:2px;text-align:center;line-height:28px;">
                      <span style="color:#c9a96e;font-size:12px;font-weight:700;font-family:Arial,sans-serif;">01</span>
                    </div>
                  </td>
                  <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f0ede8;vertical-align:top;">
                    <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#1c1c1c;font-family:Arial,sans-serif;">New Collections & Launches</p>
                    <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;font-family:Arial,sans-serif;">Be first to explore our newest workspace furniture and designs.</p>
                  </td>
                </tr>

                <!-- Perk 2 -->
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ede8;vertical-align:top;" width="36">
                    <div style="width:28px;height:28px;background-color:#1c1c1c;border-radius:2px;text-align:center;line-height:28px;">
                      <span style="color:#c9a96e;font-size:12px;font-weight:700;font-family:Arial,sans-serif;">02</span>
                    </div>
                  </td>
                  <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f0ede8;vertical-align:top;">
                    <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#1c1c1c;font-family:Arial,sans-serif;">Exclusive Subscriber Offers</p>
                    <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;font-family:Arial,sans-serif;">Special pricing and promotions reserved for our newsletter community.</p>
                  </td>
                </tr>

                <!-- Perk 3 -->
                <tr>
                  <td style="padding:10px 0;vertical-align:top;" width="36">
                    <div style="width:28px;height:28px;background-color:#1c1c1c;border-radius:2px;text-align:center;line-height:28px;">
                      <span style="color:#c9a96e;font-size:12px;font-weight:700;font-family:Arial,sans-serif;">03</span>
                    </div>
                  </td>
                  <td style="padding:10px 0 10px 16px;vertical-align:top;">
                    <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#1c1c1c;font-family:Arial,sans-serif;">Design Tips & Inspiration</p>
                    <p style="margin:0;font-size:12px;color:#888888;line-height:1.6;font-family:Arial,sans-serif;">Expert advice on creating productive and beautiful workspaces.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td align="center" style="padding:28px;">
                    <p style="margin:0 0 18px;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      Explore our latest workspace furniture collections.
                    </p>
                    <a href="${process.env.FRONTEND_URL || "#"}" style="display:inline-block;padding:12px 40px;background-color:#c9a96e;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                      Shop Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- UNSUBSCRIBE NOTE -->
          <tr>
            <td align="center" style="padding:0 50px 28px;">
              <p style="margin:0;font-size:11px;color:#bbbbbb;line-height:1.8;font-family:Arial,sans-serif;">
                You're receiving this because you subscribed at 
                <a href="${process.env.FRONTEND_URL || "#"}" style="color:#c9a96e;text-decoration:none;">bosq.ae</a>.<br/>
                If this was a mistake, you can 
                <a href="${process.env.FRONTEND_URL || "#"}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#c9a96e;text-decoration:none;">unsubscribe here</a>.
              </p>
            </td>
          </tr>

          <!-- SOCIAL -->
          <tr>
            <td align="center" style="padding:0 50px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:13px;font-weight:700;font-family:Arial,sans-serif;">f</span>
                    </a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:11px;font-family:Arial,sans-serif;">&#9679;</span>
                    </a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;">
                      <span style="color:#ffffff;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">in</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}


// ─────────────────────────────────────────────
//  NEWSLETTER — Admin Notification
// ─────────────────────────────────────────────
static async sendNewsletterAdmin(email) {
  const transporter = this.getTransporter();

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Newsletter Subscriber – ${email}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Newsletter Subscriber</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                    <div style="font-size:10px;color:#999999;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">organic living</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ALERT BADGE -->
          <tr>
            <td align="center" style="padding:36px 50px 8px;">
              <div style="display:inline-block;background-color:#fff4e0;border:1px solid #c9a96e;border-radius:20px;padding:6px 18px;">
                <span style="font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                  ● New Subscriber
                </span>
              </div>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td align="center" style="padding:16px 50px 8px;">
              <h1 style="margin:0;font-size:26px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;line-height:1.3;">
                New Newsletter Subscriber
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:#999999;font-family:Arial,sans-serif;">
                ${new Date().toLocaleString("en-AE", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:24px 50px 0;">
              <hr style="border:none;border-top:1px solid #e8e3db;margin:0;"/>
            </td>
          </tr>

          <!-- SUBSCRIBER DETAIL -->
          <tr>
            <td style="padding:28px 50px 36px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Subscriber Details
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="140" style="padding:12px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Email</span>
                  </td>
                  <td style="padding:12px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #c9a96e;">
                    <a href="mailto:${email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;font-weight:600;">${email}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved. &nbsp;|&nbsp; Internal Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}


// ─────────────────────────────────────────────
//  PROJECT ENQUIRY — User Confirmation
// ─────────────────────────────────────────────
static async sendProjectEnquiry(data) {
  const transporter = this.getTransporter();

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: data.email,
    subject: "We've Received Your Project Enquiry – BOSQ",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Project Enquiry Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                    <div style="font-size:10px;color:#999999;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">organic living</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO TITLE -->
          <tr>
            <td align="center" style="padding:44px 50px 12px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;letter-spacing:0.5px;line-height:1.3;">
                Thank You For Your Enquiry
              </h1>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:20px 50px 28px;">
              <p style="margin:0 0 14px;font-size:15px;color:#444444;line-height:1.7;font-family:Georgia,serif;">
                Dear ${data.name},
              </p>
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.85;font-family:Arial,sans-serif;">
                We have received your project enquiry and appreciate your interest in BOSQ.
                Our team is reviewing your requirements and will be in touch with you shortly.
              </p>
            </td>
          </tr>

          <!-- ENQUIRY SUMMARY -->
          <tr>
            <td style="padding:0 50px 32px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Your Enquiry Summary
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;border:1px solid #e8e3db;border-radius:3px;">

                <!-- Name -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Name</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.name}</span>
                  </td>
                </tr>

                <!-- Email -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Email</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.email}</span>
                  </td>
                </tr>

                ${data.phone ? `
                <!-- Phone -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Phone</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.phone}</span>
                  </td>
                </tr>` : ""}

                ${data.project_title ? `
                <!-- Project -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Project</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.project_title}</span>
                  </td>
                </tr>` : ""}

                <!-- Message -->
                <tr>
                  <td width="160" style="padding:12px 18px;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Message</span>
                  </td>
                  <td style="padding:12px 18px;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#444444;line-height:1.75;font-family:Arial,sans-serif;">${data.message}</span>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- WHAT HAPPENS NEXT -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td style="padding:24px 28px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      What Happens Next?
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 20px;">
                    <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      Our BOSQ team will contact you within <strong style="color:#ffffff;">24 hours</strong> with
                      more information about the project and next steps.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 28px 28px;">
                    <a href="mailto:${process.env.EMAIL_FROM || ""}" style="display:inline-block;padding:12px 36px;background-color:#ffffff;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                      Contact Us
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTACT INFO -->
          <tr>
            <td align="center" style="padding:0 50px 28px;">
              <p style="margin:0;font-size:12px;color:#888888;line-height:1.8;font-family:Arial,sans-serif;">
                For immediate assistance, call us at
                <a href="tel:+97156103637" style="color:#c9a96e;text-decoration:none;">+971 56 103 637</a>
                &nbsp;or email&nbsp;
                <a href="mailto:sales@bosq.ae" style="color:#c9a96e;text-decoration:none;">sales@bosq.ae</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}


// ─────────────────────────────────────────────
//  PROJECT ENQUIRY — Admin Notification
// ─────────────────────────────────────────────
static async sendProjectEnquiryAdmin(data) {
  const transporter = this.getTransporter();

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "BOSQ"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Project Enquiry – ${data.name}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Project Enquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#1c1c1c;padding:36px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="display:inline-block;background-color:#c9a96e;border-radius:3px;padding:6px 8px;font-size:16px;font-weight:700;color:#1c1c1c;font-family:Georgia,serif;line-height:1;">b</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:2px;">BOSQ</span>
                    <div style="font-size:10px;color:#999999;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">organic living</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ALERT BADGE -->
          <tr>
            <td align="center" style="padding:36px 50px 8px;">
              <div style="display:inline-block;background-color:#fff4e0;border:1px solid #c9a96e;border-radius:20px;padding:6px 18px;">
                <span style="font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                  ● New Project Enquiry
                </span>
              </div>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td align="center" style="padding:16px 50px 8px;">
              <h1 style="margin:0;font-size:26px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;line-height:1.3;">
                New Project Enquiry
              </h1>
              <p style="margin:10px 0 0;font-size:13px;color:#999999;font-family:Arial,sans-serif;">
                ${new Date().toLocaleString("en-AE", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:24px 50px 0;">
              <hr style="border:none;border-top:1px solid #e8e3db;margin:0;"/>
            </td>
          </tr>

          <!-- CONTACT DETAILS -->
          <tr>
            <td style="padding:28px 50px 8px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Contact Details
              </p>

              <!-- Name Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Name</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.name}</span>
                  </td>
                </tr>
              </table>

              <!-- Email Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Email</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    <a href="mailto:${data.email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.email}</a>
                  </td>
                </tr>
              </table>

              <!-- Phone Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Phone</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #e8e3db;">
                    ${data.phone
                      ? `<a href="tel:${data.phone}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.phone}</a>`
                      : `<span style="font-size:14px;color:#bbbbbb;font-family:Arial,sans-serif;font-style:italic;">Not provided</span>`
                    }
                  </td>
                </tr>
              </table>

              ${data.project_title ? `
              <!-- Project Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Project</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid #c9a96e;">
                    <span style="font-size:14px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.project_title}</span>
                  </td>
                </tr>
              </table>` : ""}

            </td>
          </tr>

          <!-- MESSAGE BOX -->
          <tr>
            <td style="padding:8px 50px 36px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Message
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;background-color:#f7f5f2;border-left:3px solid #c9a96e;border-radius:0 3px 3px 0;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.85;font-family:Arial,sans-serif;">
                      ${data.message}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ACTION BLOCK -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td style="padding:24px 28px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                      Action Required
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 20px;">
                    <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      Please follow up with this customer within <strong style="color:#ffffff;">24 hours</strong> to provide
                      further information about the project.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 28px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <a href="mailto:${data.email}" style="display:inline-block;padding:11px 28px;background-color:#c9a96e;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                            Reply to Customer
                          </a>
                        </td>
                        ${data.phone ? `
                        <td>
                          <a href="tel:${data.phone}" style="display:inline-block;padding:11px 28px;background-color:transparent;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;border:1px solid #555555;font-family:Arial,sans-serif;">
                            Call Customer
                          </a>
                        </td>` : ""}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:20px 50px;background-color:#f7f5f2;border-top:1px solid #e8e3db;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                &copy; ${new Date().getFullYear()} Bosq. All Rights Reserved. &nbsp;|&nbsp; Internal Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
}

module.exports = EmailService;

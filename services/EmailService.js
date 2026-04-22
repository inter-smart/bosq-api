const nodemailer = require("nodemailer");
const models = require("../database/models");
const { generateImageUrl } = require("../modules/frontend/traits/imageUrlHelper");

class EmailService {
  static transporter = null;

  static getEmailFromByType = (type) => {
    switch (type) {
      case "auth":
        return process.env.AUTH_EMAIL_FROM;

      case "enquiries":
        return process.env.ENQUIRY_EMAIL_FROM;

      case "newsletter":
        return process.env.NEWSLETTER_EMAIL_FROM;

      case "orders":
        return process.env.ORDER_EMAIL_FLOW;

      default:
        return process.env.AUTH_EMAIL_FROM; // fallback
    }
  };

  static async getMailerSettings(type) {
    try {
      const setting = await models.models.MailerSettings.findOne({
        where: { type },
      });

      if (setting?.to_email) {
        console.log("to_email", setting.to_email);
        console.log("cc_emails", setting.cc_emails);

        const defaultFrom = this.getEmailFromByType(type);

        return {
          from: setting.to_email || defaultFrom,
          cc: setting.cc_emails ? setting.cc_emails.split(",").map((e) => e.trim()) : [],
        };
      }
    } catch (_) {}

    const defaultFrom = this.getEmailFromByType(type);

    return {
      from: defaultFrom,
      cc: [],
    };
  }

  static async getMailerSender(type) {
    const settings = await this.getMailerSettings(type);
    return settings.from;
  }

  // static getTransporter() {
  //   if (!this.transporter) {
  //     this.transporter = nodemailer.createTransport({
  //       host: process.env.SMTP_HOST,
  //       port: parseInt(process.env.SMTP_PORT) || 587,
  //       secure: process.env.SMTP_SECURE === "true",
  //       auth: {
  //         user: process.env.SMTP_USER,
  //         pass: process.env.SMTP_PASS,
  //       },
  //     });
  //   }
  //   return this.transporter;
  // }

  static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: "email-smtp.ap-south-1.amazonaws.com",
        port: 587, // STARTTLS port
        secure: false, // false for STARTTLS
        requireTLS: true, // enforce TLS
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // optional for some environments
        },
      });
    }

    return this.transporter;
  }

  static async sendEmail({ to, subject, html, text, type = "orders" }) {
    const transporter = this.getTransporter();
    const settings = await this.getMailerSettings(type);

    const mailOptions = {
      from: settings.from,
      to,
      cc: settings.cc,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
      emailtype: type,
    };

    console.log(`[EmailService] sending "${subject}" | from=${mailOptions.from} to=${mailOptions.to} cc=${JSON.stringify(mailOptions.cc)}`);
    return transporter.sendMail(mailOptions);
  }

  static async getSocialIconsHtml() {
    try {
      const socialLinks = await models.SocialMedia.findAll({
        where: { status: true },
        order: [["sort_order", "ASC"]],
      });

      if (!socialLinks || !socialLinks.length) return "";

      const iconsHtml = socialLinks
        .map((item) => {
          const label = item.icon_alt ? item.icon_alt.substring(0, 2) : "●";
          const href = item.link || "#";
          return `<td style="padding:0 6px;"><a href="${href}" style="display:inline-block;width:32px;height:32px;background-color:#1c1c1c;border-radius:50%;text-align:center;line-height:32px;text-decoration:none;"><span style="color:#ffffff;font-size:11px;font-weight:700;font-family:Arial,sans-serif;">${label}</span></a></td>`;
        })
        .join("");

      return `<tr><td align="center" style="padding:0 50px 24px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${iconsHtml}</tr></table></td></tr>`;
    } catch (e) {
      return "";
    }
  }

  static async sendPasswordResetEmail(email, data) {
    const html = this.getPasswordResetTemplate(data);

    return this.sendEmail({
      to: email,
      subject: `${data.otp} is your password reset code`,
      html,
      type: "auth",
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
    const html = `
        <div style="font-family: Arial, sans-serif;">
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 3px;">${otp}</h1>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `;

    return this.sendEmail({
      to,
      subject: "Your OTP for Registration",
      html,
      type: "auth",
    });
  }

  // For contact enquiry
  static async sendContactEnquiry(data) {
    const transporter = this.getTransporter();
    const socialIconsHtml = await EmailService.getSocialIconsHtml();
    const settings = await this.getMailerSettings("enquiries");

    return transporter.sendMail({
      from: settings.from,
      to: data.email,
      cc: settings.cc,
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
                ${
                  data.phone
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

          ${socialIconsHtml}

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

  // ─────────────────────────────────────────────
  //  ADMIN EMAIL SHARED HELPERS
  // ─────────────────────────────────────────────

  static _adminEmailHtml({ badge, title, body }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

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

          <tr>
            <td align="center" style="padding:36px 50px 8px;">
              <div style="display:inline-block;background-color:#fff4e0;border:1px solid #c9a96e;border-radius:20px;padding:6px 18px;">
                <span style="font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">● ${badge}</span>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:16px 50px 8px;">
              <h1 style="margin:0;font-size:26px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;line-height:1.3;">${title}</h1>
              <p style="margin:10px 0 0;font-size:13px;color:#999999;font-family:Arial,sans-serif;letter-spacing:0.3px;">
                ${new Date().toLocaleString("en-AE", { dateStyle: "full", timeStyle: "short" })}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 50px 0;">
              <hr style="border:none;border-top:1px solid #e8e3db;margin:0;"/>
            </td>
          </tr>

          ${body}

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
</html>`.trim();
  }

  static _detailRow(label, value, { highlight = false } = {}) {
    const borderColor = highlight ? "#c9a96e" : "#e8e3db";
    return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td width="140" style="padding:10px 14px;background-color:#f7f5f2;border-radius:3px 0 0 3px;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">${label}</span>
                  </td>
                  <td style="padding:10px 16px;background-color:#fafaf8;border-radius:0 3px 3px 0;border-left:2px solid ${borderColor};">
                    ${value}
                  </td>
                </tr>
              </table>`;
  }

  static _ctaBlock({ email, phone, followUpText, replyLabel, callLabel }) {
    return `
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td style="padding:24px 28px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Action Required</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 20px;">
                    <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">${followUpText}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 28px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;">
                          <a href="mailto:${email}" style="display:inline-block;padding:11px 28px;background-color:#c9a96e;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">${replyLabel}</a>
                        </td>
                        ${
                          phone
                            ? `
                        <td>
                          <a href="tel:${phone}" style="display:inline-block;padding:11px 28px;background-color:transparent;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;border:1px solid #555555;font-family:Arial,sans-serif;">${callLabel}</a>
                        </td>`
                            : ""
                        }
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
  }

  static async _sendAdminMail(subject, html) {
    const transporter = this.getTransporter();
    const settings = await this.getMailerSettings("admin");
    console.log(`[EmailService] sending "${subject}" | from=${settings.from} to=${settings.from} cc=${JSON.stringify(settings.cc)}`);
    return transporter.sendMail({ from: settings.from, to: settings.from, subject, html });
  }

  // ─────────────────────────────────────────────

  static async sendProductEnquiryAdmin(data) {
    const nameVal = `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.name}</span>`;
    const emailVal = `<a href="mailto:${data.email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.email}</a>`;
    const phoneVal = data.phone
      ? `<a href="tel:${data.phone}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.phone}</a>`
      : `<span style="font-size:14px;color:#bbbbbb;font-family:Arial,sans-serif;font-style:italic;">Not provided</span>`;

    const body = `
          <tr>
            <td style="padding:28px 50px 8px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Enquiry Details</p>
              ${data.product_name ? this._detailRow("Product", `<span style="font-size:14px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.product_name}</span>`, { highlight: true }) : ""}
              ${this._detailRow("Name", nameVal)}
              ${this._detailRow("Email", emailVal)}
              ${this._detailRow("Phone", phoneVal)}
              ${data.city ? this._detailRow("City", `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.city}</span>`) : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 50px 36px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;background-color:#f7f5f2;border-left:3px solid #c9a96e;border-radius:0 3px 3px 0;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.85;font-family:Arial,sans-serif;">${data.message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${this._ctaBlock({
            email: data.email,
            phone: data.phone,
            followUpText: `Please follow up with this customer within <strong style="color:#ffffff;">24 hours</strong> to provide tailored recommendations and pricing.`,
            replyLabel: "Reply to Customer",
            callLabel: "Call Customer",
          })}`;

    return this._sendAdminMail(
      `New Product Enquiry – ${data.name}`,
      this._adminEmailHtml({ badge: "New Product Enquiry", title: "New Product Enquiry", body })
    );
  }

  static async sendContactEnquiryAdmin(data) {
    const emailVal = (v) => `<a href="mailto:${v}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${v}</a>`;
    const phoneVal = (v) =>
      v
        ? `<a href="tel:${v}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${v}</a>`
        : `<span style="font-size:14px;color:#bbbbbb;font-family:Arial,sans-serif;font-style:italic;">Not provided</span>`;

    const body = `
          <tr>
            <td style="padding:28px 50px 8px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Contact Details</p>
              ${this._detailRow("Name", `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.name}</span>`)}
              ${this._detailRow("Email", emailVal(data.email))}
              ${this._detailRow("Phone", phoneVal(data.phone))}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 50px 36px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;background-color:#f7f5f2;border-left:3px solid #c9a96e;border-radius:0 3px 3px 0;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.85;font-family:Arial,sans-serif;">${data.message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${this._ctaBlock({
            email: data.email,
            phone: data.phone,
            followUpText: `Please follow up with this customer within <strong style="color:#ffffff;">24 hours</strong> to provide tailored recommendations and pricing.`,
            replyLabel: "Reply to Customer",
            callLabel: "Call Customer",
          })}`;

    const subject = `New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Enquiry – ${data.name}`;
    return this._sendAdminMail(subject, this._adminEmailHtml({ badge: "New Enquiry Received", title: "New Contact Enquiry", body }));
  }

  // Product Enquire

  static async sendQueryAcknowledgement(email, name) {
    const transporter = this.getTransporter();
    const socialIconsHtml = await EmailService.getSocialIconsHtml();
    const settings = await this.getMailerSettings("enquiries");

    return transporter.sendMail({
      from: settings.from,
      to: email,
      cc: settings.cc,
      subject: "We've Received Your Query – BOSQ",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Query Received</title>
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
                <span style="font-size:26px;">🕐</span>
              </div>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td align="center" style="padding:20px 50px 12px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#1c1c1c;font-family:Georgia,serif;letter-spacing:0.5px;line-height:1.3;">
                We've Got Your Message
              </h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td align="center" style="padding:8px 60px 40px;">
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.9;font-family:Arial,sans-serif;text-align:center;">
                Thank you for reaching out to us${name ? `, ${name}` : ""}. Our team has received your query and will review it shortly. We'll be in touch with you as soon as possible.
              </p>
            </td>
          </tr>

          <!-- CTA BLOCK -->
          <tr>
            <td style="padding:0 50px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1c1c;border-radius:3px;">
                <tr>
                  <td align="center" style="padding:28px;">
                    <p style="margin:0 0 18px;font-size:14px;color:#cccccc;line-height:1.8;font-family:Arial,sans-serif;">
                      While you wait, feel free to browse our collections.
                    </p>
                    <a href="${process.env.FRONTEND_URL || "#"}" style="display:inline-block;padding:12px 40px;background-color:#c9a96e;color:#1c1c1c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Arial,sans-serif;">
                      Visit BOSQ
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${socialIconsHtml}

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
  //  GENERAL ENQUIRY — User Confirmation
  // ─────────────────────────────────────────────
  static async sendGeneralEnquiry(data) {
    const transporter = this.getTransporter();
    const socialIconsHtml = await EmailService.getSocialIconsHtml();
    const settings = await this.getMailerSettings("enquiries");

    return transporter.sendMail({
      from: settings.from,
      to: data.email,
      cc: settings.cc,
      subject: "We've Received Your General Enquiry – BOSQ",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>General Enquiry Confirmation</title>
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
                We have received your general enquiry and appreciate your interest in BOSQ. 
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

                ${
                  data.company_name
                    ? `
                <!-- Company -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Company</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.company_name}</span>
                  </td>
                </tr>`
                    : ""
                }

                <!-- Help Option -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Help Required</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.option_label || "General Request"}</span>
                  </td>
                </tr>

                ${
                  data.state_label
                    ? `
                <!-- State -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">State</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.state_label}</span>
                  </td>
                </tr>`
                    : ""
                }

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
                      Our BOSQ specialist will contact you within <strong style="color:#ffffff;">24 hours</strong> with
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

          ${socialIconsHtml}

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
  //  GENERAL ENQUIRY — Admin Notification
  // ─────────────────────────────────────────────
  static async sendGeneralEnquiryAdmin(data) {
    const nameVal = `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.first_name} ${data.last_name}</span>`;
    const emailVal = `<a href="mailto:${data.email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.email}</a>`;
    const phoneVal = data.phone
      ? `<a href="tel:${data.phone}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.phone}</a>`
      : `<span style="font-size:14px;color:#bbbbbb;font-family:Arial,sans-serif;font-style:italic;">Not provided</span>`;
    const helpVal = `<span style="font-size:14px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.option_label || `Option ID: ${data.options_id}`}</span>`;

    const body = `
          <tr>
            <td style="padding:28px 50px 8px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Contact Details</p>
              ${this._detailRow("Full Name", nameVal)}
              ${data.company_name ? this._detailRow("Company", `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.company_name}</span>`) : ""}
              ${this._detailRow("Email", emailVal)}
              ${this._detailRow("Phone", phoneVal)}
              ${this._detailRow("Help With", helpVal, { highlight: true })}
              ${data.state_label ? this._detailRow("State", `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.state_label}</span>`) : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 50px 36px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;background-color:#f7f5f2;border-left:3px solid #c9a96e;border-radius:0 3px 3px 0;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.85;font-family:Arial,sans-serif;">${data.message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${this._ctaBlock({
            email: data.email,
            phone: data.phone,
            followUpText: `Please follow up with this customer within <strong style="color:#ffffff;">24 hours</strong> to provide tailored recommendations and pricing.`,
            replyLabel: "Reply to Customer",
            callLabel: "Call Customer",
          })}`;

    return this._sendAdminMail(
      `New General Enquiry – ${data.first_name} ${data.last_name}`,
      this._adminEmailHtml({ badge: "New General Enquiry", title: "New General Enquiry", body }),
    );
  }

  // ─────────────────────────────────────────────
  //  PROJECT ENQUIRY — User Confirmation
  // ─────────────────────────────────────────────
  static async sendProjectEnquiry(data) {
    const transporter = this.getTransporter();
    const socialIconsHtml = await EmailService.getSocialIconsHtml();
    const settings = await this.getMailerSettings("enquiries");

    return transporter.sendMail({
      from: settings.from,
      to: data.email,
      cc: settings.cc,
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
                Thank You For Your Project Enquiry
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
                We have received your project enquiry and appreciate your interest in BOSQ. 
                Our project team is reviewing your requirements and will provide a 
                comprehensive proposal tailored to your space.
              </p>
            </td>
          </tr>

          <!-- ENQUIRY SUMMARY -->
          <tr>
            <td style="padding:0 50px 32px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">
                Project Summary
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

                <!-- Company -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Company</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.company_name || "N/A"}</span>
                  </td>
                </tr>

                <!-- Project Type -->
                <tr>
                  <td width="160" style="padding:12px 18px;border-bottom:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Project Type</span>
                  </td>
                  <td style="padding:12px 18px;border-bottom:1px solid #e8e3db;border-left:1px solid #e8e3db;vertical-align:top;">
                    <span style="font-size:13px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.project_type || "General Project"}</span>
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td width="160" style="padding:12px 18px;vertical-align:top;">
                    <span style="font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Requirements</span>
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
                      Our project specialist will review your details and contact you within <strong style="color:#ffffff;">24-48 hours</strong> to discuss your project scope and timeline.
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

          ${socialIconsHtml}

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
    const nameVal = `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;font-weight:600;">${data.first_name} ${data.last_name}</span>`;
    const companyVal = `<span style="font-size:14px;color:#1c1c1c;font-family:Arial,sans-serif;">${data.company_name || "N/A"}</span>`;
    const emailVal = `<a href="mailto:${data.email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.email}</a>`;
    const phoneVal = data.phone
      ? `<a href="tel:${data.phone}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;">${data.phone}</a>`
      : `<span style="font-size:14px;color:#bbbbbb;font-family:Arial,sans-serif;font-style:italic;">Not provided</span>`;
    const projectTypeVal = `<span style="font-size:14px;color:#c9a96e;font-family:Arial,sans-serif;font-weight:600;">${data.project_type || "General Project"}</span>`;

    const body = `
          <tr>
            <td style="padding:28px 50px 8px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Contact Details</p>
              ${this._detailRow("Full Name", nameVal)}
              ${this._detailRow("Company", companyVal)}
              ${this._detailRow("Email", emailVal)}
              ${this._detailRow("Phone", phoneVal)}
              ${this._detailRow("Project Type", projectTypeVal, { highlight: true })}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 50px 36px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Requirements</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 24px;background-color:#f7f5f2;border-left:3px solid #c9a96e;border-radius:0 3px 3px 0;">
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.85;font-family:Arial,sans-serif;">${data.message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${this._ctaBlock({
            email: data.email,
            phone: data.phone,
            followUpText: `Please follow up with this client within <strong style="color:#ffffff;">24-48 hours</strong> to discuss their project requirements.`,
            replyLabel: "Reply to Client",
            callLabel: "Call Client",
          })}`;

    return this._sendAdminMail(
      `New Project Enquiry – ${data.first_name} ${data.last_name}`,
      this._adminEmailHtml({ badge: "New Project Enquiry", title: "New Project Enquiry", body }),
    );
  }

  // ─────────────────────────────────────────────
  //  NEWSLETTER — User Confirmation
  // ─────────────────────────────────────────────
  static async sendNewsletterConfirmation(email) {
    const transporter = this.getTransporter();
    const socialIconsHtml = await EmailService.getSocialIconsHtml();
    const settings = await this.getMailerSettings("newsletter");

    return transporter.sendMail({
      from: settings.from,
      to: email,
      emailtype: "newsletter",
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

          ${socialIconsHtml}

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
    const body = `
          <tr>
            <td style="padding:28px 50px 36px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#c9a96e;text-transform:uppercase;letter-spacing:2px;font-family:Arial,sans-serif;">Subscriber Details</p>
              ${this._detailRow("Email", `<a href="mailto:${email}" style="font-size:14px;color:#c9a96e;text-decoration:none;font-family:Arial,sans-serif;font-weight:600;">${email}</a>`, { highlight: true })}
            </td>
          </tr>`;

    return this._sendAdminMail(
      `New Newsletter Subscriber – ${email}`,
      this._adminEmailHtml({ badge: "New Subscriber", title: "New Newsletter Subscriber", body }),
    );
  }

  static async sendOrderConfirmationEmail(email, data) {
    const html = this.getOrderConfirmationTemplate(data);

    return this.sendEmail({
      to: email,
      subject: `Order Confirmed – ${data.orderCode}`,
      html,
      type: "orders",
    });
  }

  static getOrderConfirmationTemplate(data) {
    const {
      orderCode,
      name,
      paymentType,
      subtotal,
      discount_total,
      tax_total,
      grand_total,
      items = [],
      billingAddress,
      shippingAddress,
      estDelivery,
    } = data;

    const orderDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const paymentLabel = paymentType === "cod" ? "Cash on Delivery" : "Online Payment";

    const billingLine = billingAddress
      ? [billingAddress.street_address, billingAddress.apartment, billingAddress.state_name, billingAddress.country].filter(Boolean).join(", ")
      : "—";
    const shippingLine = shippingAddress
      ? [shippingAddress.street_address, shippingAddress.apartment, shippingAddress.state_name, shippingAddress.country].filter(Boolean).join(", ")
      : billingLine;
    const deliveryText = estDelivery || "To be confirmed";

    return `
    
<!DOCTYPE html>
<html>

<head>
    <title>emailer</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');
         body,
        p,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            font-family: "Open Sans", sans-serif;
            font-weight: 400;
        }
    </style>

</head>

<body bgcolor="#FFFFFF" leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
    <div style="margin:auto; width:700px;background: #ffffff;">
        <table id="Table_01" width="700" border="0" cellpadding="0" cellspacing="0" align="center">
            <tbody>
                <tr>
                    <td style="padding: 0px 0px 0px;">
                        <table width="700" style="margin: auto;">
                            <tbody>
                                <tr>
                                    <td style="width: 100%; margin: auto;">
                                        <table style="width: 100%; margin: auto;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="display: block; width: 700px; margin: 0 auto; padding: 30px 0; background: #282828; text-align: center;">
                                                        <img src="https://ux.intersmarthosting.in/Mailers/Bosq/logo.png"
                                                            width="132px" height="40" alt="banner"
                                                            style="object-fit: contain;">
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 40px 20px;">
                                        <table width="530" style="margin: auto;">
                                            <tbody>
                                                <td style="text-align:center;padding: 0;">
                                                    <h2
                                                        style="font-size: 22px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0px; margin-top: 27px; margin-bottom: 6px; line-height: 25px; text-align: center;">
                                                        Order Received !
                                                    </h2>
                                                </td>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 30px;">
                                        <table width="640" style="margin: auto 0;">
                                            <tbody>
                                                <td style="text-align:center;padding: 0;">
                                                    <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; text-align: center; margin: 0; margin-bottom: 22px;">
                                                    Dear ${name}, </h2>
                                                    <p
                                                        style="font-size: 16px; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; width: 90%; margin: 0 auto 24px; line-height: 25px; text-align: center;">
                                                        Thank you for choosing Bosq for your office seating needs! We're delighted to confirm that your office chair order has been successfully placed and is now being prepared for delivery.
                                                    </p>
                                                </td>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>


                        <table
                            style="width: 700px;">
                            <tbody>
                                <tr>
                                    <td style="text-align:center;padding: 0;">
                                        <h2
                                            style="font-size: 22px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0px; margin-top: 27px; margin-bottom: 20px; line-height: 25px; text-align: center;">
                                            Order Details
                                        </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        style="margin: auto; padding: 0 30px">
                                        <table
                                            style="width: 100%; margin: auto; height: auto; margin-bottom: 32px; border-collapse: separate; ">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 50%; height: 100%; margin-top: 0px; padding-right: 10px; vertical-align: middle; border-radius: 4px;">
                                                        <div style="background:#F2F2F2; border:1px solid #e5e5e5; padding:20px; height: 100%; min-height: 245px;">
                                                            <h2
                                                                style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0; margin-bottom: 20px;">
                                                            Order Information </h2>
                                                            <table style="width: 100%; border-collapse: collapse;">
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; line-height: 23px; padding-bottom: 25px; width: 45%; vertical-align: top; text-align: left;">Order ID:</td>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; line-height: 23px; padding-bottom: 25px; width: 55%; vertical-align: top; text-align: right; word-break: break-word;">#${orderCode}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; line-height: 23px; padding-bottom: 25px; width: 45%; vertical-align: top; text-align: left;">Order Date:</td>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; line-height: 23px; padding-bottom: 25px; width: 55%; vertical-align: top; text-align: right;">${orderDate}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; line-height: 23px; width: 45%; vertical-align: top; text-align: left;">Payment :</td>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; line-height: 23px; width: 55%; vertical-align: top; text-align: right;">${paymentLabel}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>    
                                                    </td>
                                                    <td
                                                        style="width: 50%; height: 100%; margin-top: 0px; padding-right: 10px; vertical-align: middle; border-radius: 4px;">
                                                        <div style="background:#F2F2F2; border:1px solid #e5e5e5; padding:20px; height: 100%; min-height: 245px;">
                                                            <table style="width: 100%; height: 100%; min-height: 240px;">
                                                                <tbody>
                                                                    <!-- TOP CONTENT -->
                                                                    <tr>
                                                                        <td style="vertical-align: top;">
                                                                            <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif;
                                                                                    color: #282828; font-weight: 500; margin-bottom: 12px; margin-top: 0;">
                                                                                Billing Address
                                                                            </h2>
                                                                            <p style="font-size: 16px; color: #282828; font-weight: 400;
                                                                                    font-family:  'Open Sans', sans-serif; line-height: 23px; margin: 0;">
                                                                                ${billingLine}
                                                                            </p>
                                                                        </td>
                                                                    </tr>

                                                                    <!-- BOTTOM CONTENT -->
                                                                    <tr>
                                                                        <td style="vertical-align: bottom;">
                                                                            <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif;
                                                                                    color: #282828; font-weight: 500; margin-bottom: 12px; margin-top: 0;">
                                                                                Shipping Address
                                                                            </h2>
                                                                            <p style="font-size: 16px; color: #282828; font-weight: 400;
                                                                                    font-family:  'Open Sans', sans-serif; line-height: 23px; margin: 0;">
                                                                                ${shippingLine}
                                                                            </p>
                                                                        </td>
                                                                    </tr>

                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        

                                        <table
                                            style="width: 100%; margin: auto; height: 40px; padding: 20px; background-color: #fff; margin-bottom: 30px;border: solid 1px #efeeee;">
                                            <tbody>
                                                <tr>
                                                    <td colspan="3">
                                                        <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0; margin-bottom: 10px; white-space: nowrap;">Products (${items.length} Item${items.length !== 1 ? "s" : ""}) </h2>
                                                    </td>
                                                </tr>
                                                ${items
                                                  .map(
                                                    (item) => `
                                                <tr>
                                                    <td style="width: 14%; margin-bottom: 0px; margin-top: 0px;">
                                                        <img src="${item?.image || "https://ux.intersmarthosting.in/Mailers/Bosq/prod-1.png"}" width="66px" height="55" alt="image" style="object-fit: cover;">
                                                    </td>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 5px; margin-top: 0;">
                                                            ${item?.title || "Product"}
                                                        </p>
                                                        ${item?.sku ? `<p style="font-size: 13px; font-family: 'Open Sans', sans-serif; color: #999999; font-weight: 400; margin-bottom: 5px; margin-top: 0;">SKU: ${item.sku}</p>` : ""}
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 5px; margin-top: 0;">
                                                            Qty : ${String(item?.quantity || 0).padStart(2, "0")}
                                                        </p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(item.line_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`,
                                                  )
                                                  .join("")}
                                                <tr>
                                                    <td colspan="3">
                                                        <hr style="border: none; border-top: solid 0.5px #f5f5f5; width: 100%; margin: 15px 0;">
                                                    </td>
                                                </tr>
                                                ${
                                                  parseFloat(subtotal) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Subtotal</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(subtotal).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                ${
                                                  parseFloat(discount_total) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Discount</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #c0392b; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #c0392b; margin: 0px; text-align: right; font-weight: 400;">- AED ${parseFloat(discount_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                ${
                                                  parseFloat(tax_total) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Tax</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(tax_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">
                                                            Total Amount <span style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #BBBCBC; font-weight: 400;">( Inc Tax )</span>
                                                        </p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px;color: #191919; font-weight: 600; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif;font-size: 16px; color: #191919; margin: 0px;text-align: right;font-weight: 400;">AED ${parseFloat(grand_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <table
                                            style="width: 100%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 100%; margin-top: 0px; vertical-align: top;">
                                                        <p
                                                            style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; text-align: center; font-weight: 400; margin: 0; margin-bottom: 0;">
                                                           Your office chairs will be delivered assembled and ready to use with professional setup service included.</a>
                                                           </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <table
                                            style="width: 100%; max-width: 70%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 50%; margin-top: 0px; vertical-align: top;">
                                                        <a href="" style="display: block; font-family: 'Open Sans', sans-serif; text-align: center; width: 142px; height: auto; margin: 0 auto 24px; background-color: #282828;  border-radius: 3px; color: #fff; font-size: 16px; font-weight: 400; line-height: 1; padding: 18px 20px; text-decoration: none;">
                                                            Track Order
                                                        </a>
                                                    </td>
                                                    <td
                                                        style="width: 50%; margin-top: 0px; vertical-align: top;">
                                                        <a href="" style="display: block; font-family: 'Open Sans', sans-serif; text-align: center; width: 142px; height: auto; margin: 0 auto 24px; background-color: transparent; border: solid 1px #282828; border-radius: 3px; color: #282828; font-size: 16px; font-weight: 400; line-height: 1; padding: 18px 20px; text-decoration: none;">
                                                            Need Help ?
                                                        </a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <table
                                            style="width: 100%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 100%; margin-top: 0px; vertical-align: top;">
                                                        <p
                                                            style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; text-align: center; font-weight: 500; margin: 0; margin-bottom: 0;">
                                                           <span style="color: #282828; font-weight: 400;">For immediate assistance with office chair selection,</span> <br>call us at <a href="tel:971565036378" style="text-decoration: none; color: #282828;">+971 56 503 6378 </a> or email <a href="mailto:sales@bosq.ae" style="text-decoration: none; color: #282828;">sales@bosq.ae</a>
                                                           </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <td style="padding: 0">
                    <table width="700" style="margin: auto;">
                        <tbody>
                            <tr>
                                <td style="text-align:center; padding-top:0; padding-bottom: 0;">
                                    <table align="center"  width="100%" border="0" cellpadding="0" cellspacing="0" style="padding: 20px 30px;  margin: 0; background: #282828">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <table align="center"  width="120" border="0" cellpadding="0" cellspacing="0" style="padding: 0; background: #282828; margin-bottom: 10px;">
                                                        <tbody>
                                                            <tr>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.facebook.com/bosq.ae" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/fb.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                </td>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.instagram.com/bosq.ae" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/insta.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                    </td>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.youtube.com/@BOSQUAE" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/youtube.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                </td>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.linkedin.com/company/ayn-musk-furniture-trading-co-llc-bosq-ergonomic-living-uae/?viewAsMember=true" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/linkedin.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                </td>

                                                            </tr>

                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                 <td>
                                                    <p style="margin: 0; color: #ffffff; font-size: 16px; font-family:  'Open Sans', sans-serif; text-align: center;">© 2025 Bosq. All rights reserved.</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tfoot>
        </table>
    </div>
</body>

</html>
`;
  }

  static async sendOrderStatusUpdate(email, data) {
    const {
      orderCode,
      name,
      paymentType,
      status,
      subtotal,
      discount_total,
      tax_total,
      grand_total,
      items = [],
      billingAddress,
      shippingAddress,
      estDelivery,
      cancel_reason,
    } = data;

    const paymentLabel = paymentType === "cod" ? "Cash on Delivery" : "Online Payment";
    const statusFormatted = status.charAt(0).toUpperCase() + status.slice(1);
    const orderDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const billingLine = billingAddress
      ? [billingAddress.street_address, billingAddress.apartment, billingAddress.state_name || billingAddress.state?.name, billingAddress.country]
          .filter(Boolean)
          .join(", ")
      : "—";

    const shippingLine = shippingAddress
      ? [
          shippingAddress.street_address,
          shippingAddress.apartment,
          shippingAddress.state_name || shippingAddress.state?.name,
          shippingAddress.country,
        ]
          .filter(Boolean)
          .join(", ")
      : billingLine;

    const deliveryText = estDelivery || "To be confirmed";

    let messageText = `This email is to notify you that the status of your recent Bosq order (#${orderCode}) has been updated to <strong>${statusFormatted}</strong>. We will keep you posted on any further updates regarding your shipment!`;

    if (status === "cancelled") {
      messageText = `This email is to notify you that your recent Bosq order (#${orderCode}) has been <strong>Cancelled</strong>.`;
      if (cancel_reason) {
        messageText += `<br><br><strong>Reason for Cancellation:</strong> ${cancel_reason}`;
      }
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Order Status Update</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');
         body, p, h1, h2, h3, h4, h5, h6 {
            font-family: "Open Sans", sans-serif;
            font-weight: 400;
        }
    </style>
</head>
<body bgcolor="#FFFFFF" leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
    <div style="margin:auto; width:700px;background: #ffffff;">
        <table id="Table_01" width="700" border="0" cellpadding="0" cellspacing="0" align="center">
            <tbody>
                <tr>
                    <td style="padding: 0px 0px 0px;">
                        <table width="700" style="margin: auto;">
                            <tbody>
                                <tr>
                                    <td style="width: 100%; margin: auto;">
                                        <table style="width: 100%; margin: auto;">
                                            <tbody>
                                                <tr>
                                                    <td style="display: block; width: 700px; margin: 0 auto; padding: 30px 0; background: #282828; text-align: center;">
                                                        <img src="https://ux.intersmarthosting.in/Mailers/Bosq/logo.png" width="132px" height="40" alt="banner" style="object-fit: contain;">
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 40px 20px;">
                                        <table width="530" style="margin: auto;">
                                            <tbody>
                                                <td style="text-align:center;padding: 0;">
                                                    <h2 style="font-size: 22px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0px; margin-top: 27px; margin-bottom: 6px; line-height: 25px; text-align: center;">
                                                        Order ${statusFormatted}
                                                    </h2>
                                                </td>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 30px;">
                                        <table width="640" style="margin: auto 0;">
                                            <tbody>
                                                <td style="text-align:center;padding: 0;">
                                                    <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; text-align: center; margin: 0; margin-bottom: 22px;">
                                                    Dear ${name}, </h2>
                                                    <p style="font-size: 16px; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; width: 90%; margin: 0 auto 24px; line-height: 25px; text-align: center;">
                                                        ${messageText}
                                                    </p>
                                                </td>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table style="width: 700px;">
                            <tbody>
                                <tr>
                                    <td style="text-align:center;padding: 0;">
                                        <h2 style="font-size: 22px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0px; margin-top: 27px; margin-bottom: 20px; line-height: 25px; text-align: center;">
                                            Order Details
                                        </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="margin: auto; padding: 0 30px">
                                        <table style="width: 100%; margin: auto; height: auto; margin-bottom: 32px; border-collapse: separate; ">
                                            <tbody>
                                                <tr>
                                                    <td style="width: 50%; height: 100%; margin-top: 0px; padding-right: 10px; vertical-align: middle; border-radius: 4px;">
                                                        <div style="background:#F2F2F2; border:1px solid #e5e5e5; padding:20px; height: 100%; min-height: 245px;">
                                                            <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0; margin-bottom: 20px;">
                                                            Order Information </h2>
                                                            <ul style="padding: 0; margin: 0">
                                                                <li style="display:flex; margin-bottom: 25px; list-style-type: none;">
                                                                    <p style="font-size: 16px; width: 45%; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; margin: 0px; margin-top: 0px; margin-bottom: 0; line-height: 23px; text-align: left;">
                                                                    Order ID:
                                                                    </p>
                                                                    <span style="font-size: 16px; width: 55%; color: #282828; font-weight: 500; font-family:  'Open Sans', sans-serif; margin: 0; margin-left: auto; line-height: 23px; text-align: right;">
                                                                        #${orderCode}
                                                                    </span>
                                                                </li>
                                                                <li style="display:flex; margin-bottom: 25px; list-style-type: none;">
                                                                    <p style="font-size: 16px; width: 45%; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; margin: 0px; margin-top: 0px; margin-bottom: 0; line-height: 23px; text-align: left;">
                                                                    Order Date:
                                                                    </p>
                                                                    <span style="font-size: 16px; width: 55%; color: #282828; font-weight: 500; font-family:  'Open Sans', sans-serif; margin: 0; margin-left: auto; line-height: 23px; text-align: right;">
                                                                        ${orderDate}
                                                                    </span>
                                                                </li>
                                                                <li style="display:flex; margin-bottom: 25px; list-style-type: none;">
                                                                    <p style="font-size: 16px; width: 45%; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; margin: 0px; margin-top: 0px; margin-bottom: 0; line-height: 23px; text-align: left;">
                                                                        Payment :
                                                                    </p>
                                                                    <span style="font-size: 16px; width: 55%; color: #282828; font-weight: 500; font-family:  'Open Sans', sans-serif; margin: 0; margin-left: auto; line-height: 23px; text-align: right;">
                                                                        ${paymentLabel}
                                                                    </span>
                                                                </li>
                                                            </ul>
                                                        </div>    
                                                    </td>
                                                    <td style="width: 50%; height: 100%; margin-top: 0px; padding-right: 10px; vertical-align: middle; border-radius: 4px;">
                                                        <div style="background:#F2F2F2; border:1px solid #e5e5e5; padding:20px; height: 100%; min-height: 245px;">
                                                            <table style="width: 100%; height: 100%; min-height: 240px;">
                                                                <tbody>
                                                                    <!-- TOP CONTENT -->
                                                                    <tr>
                                                                        <td style="vertical-align: top;">
                                                                            <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin-bottom: 12px; margin-top: 0;">
                                                                                Billing Address
                                                                            </h2>
                                                                            <p style="font-size: 16px; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; line-height: 23px; margin: 0;">
                                                                                ${billingLine}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                    <!-- BOTTOM CONTENT -->
                                                                    <tr>
                                                                        <td style="vertical-align: bottom;">
                                                                            <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin-bottom: 12px; margin-top: 0;">
                                                                                Shipping Address
                                                                            </h2>
                                                                            <p style="font-size: 16px; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; line-height: 23px; margin: 0;">
                                                                                ${shippingLine}
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <table style="width: 100%; margin: auto; height: 40px; padding: 20px; background-color: #fff; margin-bottom: 30px;border: solid 1px #efeeee;">
                                            <tbody>
                                                <tr>
                                                    <td colspan="3">
                                                        <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0; margin-bottom: 10px; white-space: nowrap;">Products (${items.length} Item${items.length !== 1 ? "s" : ""}) </h2>
                                                    </td>
                                                </tr>
                                                ${items
                                                  .map(
                                                    (item) => `
                                                <tr>
                                                    <td style="width: 14%; margin-bottom: 0px; margin-top: 0px;">
                                                        <img src="${generateImageUrl(item?.image) || "https://ux.intersmarthosting.in/Mailers/Bosq/prod-1.png"}" width="66px" height="55" alt="image" style="object-fit: cover;">
                                                    </td>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 5px; margin-top: 0;">
                                                            ${item?.title || "Product"}
                                                        </p>
                                                        ${item?.sku ? `<p style="font-size: 13px; font-family: 'Open Sans', sans-serif; color: #999999; font-weight: 400; margin-bottom: 5px; margin-top: 0;">SKU: ${item.sku}</p>` : ""}
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 5px; margin-top: 0;">
                                                            Qty : ${String(item?.quantity || 0).padStart(2, "0")}
                                                        </p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(item.line_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`,
                                                  )
                                                  .join("")}
                                                <tr>
                                                    <td colspan="3">
                                                        <hr style="border: none; border-top: solid 0.5px #f5f5f5; width: 100%; margin: 15px 0;">
                                                    </td>
                                                </tr>
                                                ${
                                                  parseFloat(subtotal) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Subtotal</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(subtotal).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                ${
                                                  parseFloat(discount_total) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Discount</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #c0392b; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #c0392b; margin: 0px; text-align: right; font-weight: 400;">- AED ${parseFloat(discount_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                ${
                                                  parseFloat(tax_total) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Tax</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(tax_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">
                                                            Total Amount <span style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #BBBCBC; font-weight: 400;">( Inc Tax )</span>
                                                        </p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px;color: #191919; font-weight: 600; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif;font-size: 16px; color: #191919; margin: 0px;text-align: right;font-weight: 400;">AED ${parseFloat(grand_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <table style="width: 100%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td style="width: 100%; margin-top: 0px; vertical-align: top;">
                                                        <p style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; text-align: center; font-weight: 400; margin: 0; margin-bottom: 0;">
                                                           Your office chairs will be delivered assembled and ready to use with professional setup service included.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <table style="width: 100%; max-width: 70%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td style="width: 50%; margin-top: 0px; vertical-align: top;">
                                                        <a href="${process.env.FRONTEND_URL || ""}/orders" style="display: block; font-family: 'Open Sans', sans-serif; text-align: center; width: 142px; height: auto; margin: 0 auto 24px; background-color: #282828;  border-radius: 3px; color: #fff; font-size: 16px; font-weight: 400; line-height: 1; padding: 18px 20px; text-decoration: none;">
                                                            Track Order
                                                        </a>
                                                    </td>
                                                    <td style="width: 50%; margin-top: 0px; vertical-align: top;">
                                                        <a href="mailto:sales@bosq.ae" style="display: block; font-family: 'Open Sans', sans-serif; text-align: center; width: 142px; height: auto; margin: 0 auto 24px; background-color: transparent; border: solid 1px #282828; border-radius: 3px; color: #282828; font-size: 16px; font-weight: 400; line-height: 1; padding: 18px 20px; text-decoration: none;">
                                                            Need Help ?
                                                        </a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <table style="width: 100%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td style="width: 100%; margin-top: 0px; vertical-align: top;">
                                                        <p style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; text-align: center; font-weight: 500; margin: 0; margin-bottom: 0;">
                                                           <span style="color: #282828; font-weight: 400;">For immediate assistance with office chair selection,</span> <br>call us at <a href="tel:971565036378" style="text-decoration: none; color: #282828;">+971 56 503 6378 </a> or email <a href="mailto:sales@bosq.ae" style="text-decoration: none; color: #282828;">sales@bosq.ae</a>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <td style="padding: 0">
                    <table width="700" style="margin: auto;">
                        <tbody>
                            <tr>
                                <td style="text-align:center; padding-top:0; padding-bottom: 0;">
                                    <table align="center"  width="100%" border="0" cellpadding="0" cellspacing="0" style="padding: 20px 30px;  margin: 0; background: #282828">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <table align="center"  width="120" border="0" cellpadding="0" cellspacing="0" style="padding: 0; background: #282828; margin-bottom: 10px;">
                                                        <tbody>
                                                            <tr>
                                                                <td width="5%" style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.facebook.com/bosq.ae" target="_blank" style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img src="https://ux.intersmarthosting.in/Mailers/Bosq/fb.png" alt="social" width="14px" height="14px" style="object-fit:contain"></a>
                                                                </td>
                                                                <td width="5%" style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.instagram.com/bosq.ae" target="_blank" style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img src="https://ux.intersmarthosting.in/Mailers/Bosq/insta.png" alt="social" width="14px" height="14px" style="object-fit:contain"></a>
                                                                </td>
                                                                <td width="5%" style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.youtube.com/@BOSQUAE" target="_blank" style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img src="https://ux.intersmarthosting.in/Mailers/Bosq/youtube.png" alt="social" width="14px" height="14px" style="object-fit:contain"></a>
                                                                </td>
                                                                <td width="5%" style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.linkedin.com/company/ayn-musk-furniture-trading-co-llc-bosq-ergonomic-living-uae/?viewAsMember=true" target="_blank" style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img src="https://ux.intersmarthosting.in/Mailers/Bosq/linkedin.png" alt="social" width="14px" height="14px" style="object-fit:contain"></a>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                 <td>
                                                    <p style="margin: 0; color: #ffffff; font-size: 16px; font-family:  'Open Sans', sans-serif; text-align: center;">© ${new Date().getFullYear()} Bosq. All rights reserved.</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tfoot>
        </table>
    </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: email,
      subject: `Order Update: ${orderCode} is now ${statusFormatted}`,
      html,
      type: "orders",
    });
  }
}

module.exports = EmailService;

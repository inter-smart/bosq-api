const nodemailer = require("nodemailer");
const { models } = require("../../database/models");

class MailService {
  static transporter = null;

  static async getSocialIconsHtml() {
    const BASE_IMAGE_URL = process.env.BASE_URL;
    try {
      const socialLinks = await models.models.SocialMedia.findAll({
        where: { status: true },
        order: [["sort_order", "ASC"]],
      });

      if (!socialLinks?.length) return "";

      const iconsHtml = socialLinks
        .map((item) => {
          const href = item.link || "#!";
          const iconSrc = `${BASE_IMAGE_URL}/${item.footer_icon_media_path}` || "";

          if (!iconSrc) return "";

          return `
            <td width="5%" style="text-align:center;padding-left:0;">
              <a href="${href}" target="_blank"
                style="text-decoration:none;border-radius:50%;width:18px;height:18px;margin:0 auto;display:inline-block;">
                <img
                  src="${iconSrc}"
                  alt="social"
                  width="14"
                  height="14"
                  style="display:block;border:0;"
                />
              </a>
            </td>
          `;
        })
        .join("");

      return `
        <tr>
          <td align="center" style="padding:0 50px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                ${iconsHtml}
              </tr>
            </table>
          </td>
        </tr>
      `;
    } catch (e) {
      console.error("Error fetching social icons:", e);
      return "";
    }
  }

  static getEmailFromByType = (type) => {
    switch (type) {
      case "auth":
        return process.env.AUTH_EMAIL_FROM;

      case "enquiries":
        return process.env.ENQUIRY_EMAIL_FROM;

      case "newsletter":
        return process.env.NEWSLETTER_EMAIL_FROM;

      case "orders":
        return process.env.ORDER_EMAIL_FROM;

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
    } catch (_) { }

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

  // static getTransporter() {
  //   if (!this.transporter) {
  //     this.transporter = nodemailer.createTransport({
  //       host: "email-smtp.ap-south-1.amazonaws.com",
  //       port: 587, // STARTTLS port
  //       secure: false, // false for STARTTLS
  //       requireTLS: true, // enforce TLS
  //       auth: {
  //         user: process.env.BREVO_SMTP_USER,
  //         pass: process.env.BREVO_SMTP_PASS,
  //       },
  //       tls: {
  //         rejectUnauthorized: false, // optional for some environments
  //       },
  //     });
  //   }

  //   return this.transporter;
  // }

  static async sendEmail({ to, subject, html, text, type = "orders" }) {
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

    console.log(`[EmailService] "${subject}" | from=${mailOptions.from} to=${mailOptions.to} cc=${JSON.stringify(mailOptions.cc)}`);

    if (process.env.EMAIL_DRY_RUN === "true" && (type !== "auth" || type !== "orders")) {
      console.log("[EmailService] DRY RUN — email not sent");
      return { dryRun: true };
    }

    const transporter = this.getTransporter();
    return transporter.sendMail(mailOptions);
  }
}

module.exports = MailService;

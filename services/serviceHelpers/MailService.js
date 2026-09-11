const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { models } = require("../../database/models");
const Logger = require("../../config/logger");

const ICON_MAX_SIZE = 24;

// Reads intrinsic pixel dimensions so the <img> width/height attributes can preserve
// aspect ratio instead of forcing a square box — email clients that ignore CSS
// (object-fit) stretch mismatched-aspect icons to fit fixed HTML attributes, which is
// what was producing the smeared/blurry footer icons.
const getImageDimensions = (absPath) => {
  const buffer = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase();

  if (ext === ".png" && buffer.length >= 24 && buffer.toString("ascii", 12, 16) === "IHDR") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (ext === ".svg") {
    const svg = buffer.toString("utf8");
    const widthMatch = svg.match(/width="([\d.]+)/);
    const heightMatch = svg.match(/height="([\d.]+)/);
    if (widthMatch && heightMatch) {
      return { width: parseFloat(widthMatch[1]), height: parseFloat(heightMatch[1]) };
    }
    const viewBoxMatch = svg.match(/viewBox="[\d.\s-]*?\s+[\d.\s-]*?\s+([\d.]+)\s+([\d.]+)/);
    if (viewBoxMatch) {
      return { width: parseFloat(viewBoxMatch[1]), height: parseFloat(viewBoxMatch[2]) };
    }
  }

  return null;
};

const getIconRenderSize = (absPath) => {
  try {
    const dimensions = getImageDimensions(absPath);
    if (!dimensions?.width || !dimensions?.height) {
      return { width: ICON_MAX_SIZE, height: ICON_MAX_SIZE };
    }

    const scale = ICON_MAX_SIZE / Math.max(dimensions.width, dimensions.height);
    return {
      width: Math.round(dimensions.width * scale),
      height: Math.round(dimensions.height * scale),
    };
  } catch (_) {
    return { width: ICON_MAX_SIZE, height: ICON_MAX_SIZE };
  }
};

class MailService {
  static transporter = null;

  static async getSocialIconsHtml() {
    const BASE_IMAGE_URL = process.env.BASE_URL;
    try {
      const socialLinks = await models.SocialMedia.findAll({
        where: { status: true },
        order: [["sort_order", "ASC"]],
      });

      if (!socialLinks?.length) return "";

      const iconsHtml = socialLinks
        .map((item) => {
          const href = item.link || "#!";
          const iconSrc = `${BASE_IMAGE_URL}/${item.footer_icon_media_path}` || "";

          if (!iconSrc) return "";

          const absPath = path.join(__dirname, "../..", item.footer_icon_media_path);
          const { width, height } = getIconRenderSize(absPath);

          return `
            <td align="center" valign="middle" style="text-align:center;padding-left:8px;padding-right:8px;">
              <a href="${href}" target="_blank"
                style="text-decoration:none;display:inline-block;">
                <img
                  src="${iconSrc}"
                  alt="social"
                  width="${width}"
                  height="${height}"
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
    // if (process.env.USETESTMAIL === "true" && process.env.TESTMAIL) {
    //   return {
    //     from: process.env.TESTMAIL,
    //     cc: [],
    //   };
    // }

    try {
      const setting = await models.MailerSettings.findOne({
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

  static getTransporter() {
    if (!this.transporter) {
      if (process.env.USE_BREVO === "true") {
        this.transporter = nodemailer.createTransport({
          host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
          port: parseInt(process.env.BREVO_SMTP_PORT) || 587, // STARTTLS port
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
      } else {
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
    }

    return this.transporter;
  }

  static async sendEmail({ to, subject, html, text, type = "orders" }) {
    const settings = await this.getMailerSettings(type);

    const mailOptions = {
      from: settings.from,
      to,
      // Only auth emails (OTP/password-reset) carry a cc. For every other type, cc addresses
      // are sent on the admin-notification email instead (see EmailService._sendAdminMail).
      cc: type === "auth" ? settings.cc : undefined,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
      emailtype: type,
    };

    if (process.env.EMAIL_DRY_RUN === "true" && type !== "auth") {
      Logger.info(
        `[MailService] DRY RUN — not sent | type="${type}" subject="${subject}" user=${mailOptions.to} cc=${JSON.stringify(mailOptions.cc || [])}`,
      );
      return { dryRun: true };
    }

    const transporter = this.getTransporter();
    const result = await transporter.sendMail(mailOptions);
    Logger.info(
      `[MailService] User mail sent | type="${type}" subject="${subject}" user=${mailOptions.to} cc=${JSON.stringify(mailOptions.cc || [])}`,
    );
    return result;
  }
}

module.exports = MailService;

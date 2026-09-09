const { emailResponsiveHead, EMAIL_WRAPPER_OPEN, EMAIL_WRAPPER_CLOSE, emailFooter } = require("./emailLayout");

const contactEnquiryTemplate = (data, iconsHtml = "") => {
  const { name, message, phone, email } = data;
  const companyPhone = process.env.COMPANY_PHONE || "+971 56 103 637";
  const companyEmail = process.env.COMPANY_EMAIL || "sales@bosq.ae";
  const contactUrl = `mailto:${companyEmail}`;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Thank You for Contacting Bosq</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    ${emailResponsiveHead()}
</head>

<body bgcolor="#FFFFFF" style="margin:0;padding:0;font-family:'Open Sans',sans-serif;">
    ${EMAIL_WRAPPER_OPEN}
                <!-- Header -->
                <tr>
                    <td style="padding:30px 0; background:#282828; text-align:center;">
                        <img
                            src="https://ux.intersmarthosting.in/Mailers/Bosq/logo.png"
                            width="132"
                            height="40"
                            alt="Bosq Logo"
                            style="display:block; margin:0 auto; border:0;"
                        />
                    </td>
                </tr>

                <!-- Title -->
                <tr>
                    <td style="padding:27px 40px 20px;">
                        <h2 style="font-size:22px; color:#282828; font-weight:600; margin:0; text-align:center;">
                            Thank You for Contacting Us
                        </h2>
                    </td>
                </tr>

                <!-- Intro -->
                <tr>
                    <td style="padding:0 30px;">
                        <h3 style="font-size:16px; color:#282828; font-weight:500; text-align:center; margin:0 0 22px;">
                            Dear ${name || "Valued Customer"},
                        </h3>

                        <p style="font-size:16px; color:#282828; width:95%; margin:0 auto 24px; line-height:25px; text-align:center;">
                            Thank you for reaching out to Bosq.
                            We have successfully received your enquiry submitted through our contact form.
                            Our team is currently reviewing your message and will get back to you as soon as possible.
                        </p>
                    </td>
                </tr>

                <!-- Submitted Message -->
                ${
                  message
                    ? `
                <tr>
                    <td class="content-pad" style="padding:0 30px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="width:100%; display:table; padding:20px; background:#F2F2F2; border:1px solid #e5e5e5; margin-bottom:32px;">
                            <tr>
                                <td>
                                    <h2 style="font-size:16px; color:#282828; font-weight:500; margin:0 0 12px;">
                                        Your Message
                                    </h2>

                                    <p style="font-size:14px; color:#444444; line-height:24px; margin:0;">
                                        ${message}
                                    </p>

                                    ${
                                      phone
                                        ? `
                                    <p style="font-size:13px; color:#888888; margin:16px 0 0;">
                                        Contact Number: ${phone}
                                    </p>
                                    `
                                        : ""
                                    }
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                `
                    : ""
                }

                <!-- Next Steps -->
                <tr>
                    <td class="content-pad" style="padding:0 30px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#282828; border:1px solid #8e8e8e; margin-bottom:32px;">
                            <tr>
                                <td>
                                    <h2 style="font-size:16px; color:#ffffff; font-weight:500; margin:0 0 12px;">
                                        What Happens Next?
                                    </h2>

                                    <p style="font-size:14px; color:#cccccc; line-height:24px; margin:0 0 20px;">
                                        Our support team will review your enquiry and respond within 24 hours.
                                        Whether your query is about products, custom solutions, pricing,
                                        or general assistance, we are here to help.
                                    </p>

                                    <div style="text-align:center;">
                                        <a href="${contactUrl}"
                                            style="display:inline-block; padding:12px 36px; background:#ffffff; color:#282828; text-decoration:none; font-size:14px; font-weight:600; border-radius:3px;">
                                            Contact Support
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Contact Info -->
                <tr>
                    <td style="padding:0 30px 30px;">
                        <p style="font-size:14px; color:#888888; line-height:24px; text-align:center; margin:0;">
                            For urgent assistance, please contact us at<br/>
                            <a href="tel:${companyPhone}" style="color:#282828; text-decoration:none;">
                                ${companyPhone}
                            </a>
                            &nbsp;or&nbsp;
                            <a href="mailto:${companyEmail}" style="color:#282828; text-decoration:none;">
                                ${companyEmail}
                            </a>
                        </p>
                    </td>
                </tr>

            </tbody>
${emailFooter(iconsHtml, currentYear)}
    ${EMAIL_WRAPPER_CLOSE}
</body>
</html>
`;
};

module.exports = contactEnquiryTemplate;

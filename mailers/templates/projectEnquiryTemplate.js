const projectEnquiryTemplate = (data, iconsHtml = "") => {
  const companyPhone = process.env.COMPANY_PHONE || "+971 56 103 637";
  const companyEmail = process.env.COMPANY_EMAIL || "sales@bosq.ae";
  const contactUrl = `mailto:${companyEmail}`;
  const currentYear = new Date().getFullYear();

  const { first_name, last_name, company_name, project_type, message } = data;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Project Enquiry Confirmation</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>

<body bgcolor="#FFFFFF" style="margin:0;padding:0;font-family:'Open Sans',sans-serif;">
    <div style="margin:auto; width:700px; background:#ffffff;">
        <table width="700" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:auto;">
            <tbody>

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
                            Thank You for Your Project Enquiry
                        </h2>
                    </td>
                </tr>

                <!-- Intro -->
                <tr>
                    <td style="padding:0 30px;">
                        <h3 style="font-size:16px; color:#282828; font-weight:500; text-align:center; margin:0 0 22px;">
                            Dear ${first_name} ${last_name},
                        </h3>

                        <p style="font-size:16px; color:#282828; width:95%; margin:0 auto 24px; line-height:25px; text-align:center;">
                            Thank you for reaching out to Bosq regarding your project requirements.
                            Our project team has received your enquiry and is currently reviewing
                            your space, scope, and specific requirements.
                        </p>
                    </td>
                </tr>

                <!-- Project Summary -->
                <tr>
                    <td style="padding:0 30px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#F2F2F2; border:1px solid #e5e5e5; margin-bottom:32px;">
                            <tr>
                                <td>
                                    <h2 style="font-size:16px; color:#282828; font-weight:500; margin:0 0 16px;">
                                        Project Summary
                                    </h2>

                                    <p style="font-size:14px; color:#444444; margin:0 0 12px;">
                                        <strong>Name:</strong> ${first_name} ${last_name}
                                    </p>

                                    <p style="font-size:14px; color:#444444; margin:0 0 12px;">
                                        <strong>Company:</strong> ${company_name || "N/A"}
                                    </p>

                                    <p style="font-size:14px; color:#444444; margin:0 0 12px;">
                                        <strong>Project Type:</strong> ${project_type}
                                    </p>

                                    <p style="font-size:14px; color:#444444; line-height:24px; margin:0;">
                                        <strong>Requirements:</strong><br/>
                                        ${message}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Next Steps -->
                <tr>
                    <td style="padding:0 30px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#282828; border:1px solid #8e8e8e; margin-bottom:32px;">
                            <tr>
                                <td>
                                    <h2 style="font-size:16px; color:#ffffff; font-weight:500; margin:0 0 12px;">
                                        What Happens Next?
                                    </h2>

                                    <p style="font-size:14px; color:#cccccc; line-height:24px; margin:0 0 20px;">
                                        Our project specialist will carefully review your requirements
                                        and contact you within 24–48 hours to discuss project scope,
                                        design approach, pricing, and estimated timelines.
                                    </p>

                                    <div style="text-align:center;">
                                        <a href="${contactUrl}"
                                            style="display:inline-block; padding:12px 36px; background:#ffffff; color:#282828; text-decoration:none; font-size:14px; font-weight:600; border-radius:3px;">
                                            Contact Our Team
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
                            For immediate assistance, please contact us at<br/>
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

            <!-- Footer -->
            <tfoot>
                <tr>
                    <td style="padding:0;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="background:#282828;">
                            <tbody>

                                ${
                                  iconsHtml
                                    ? `
                                <tr>
                                    <td style="padding:20px 30px 10px; text-align:center;">
                                        <table align="center" width="120" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                ${iconsHtml}
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                `
                                    : ""
                                }

                                <tr>
                                    <td style="padding:10px 30px 20px;">
                                        <p style="margin:0; color:#ffffff; font-size:16px; text-align:center;">
                                            © ${currentYear} Bosq. All rights reserved.
                                        </p>
                                    </td>
                                </tr>

                            </tbody>
                        </table>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
</body>
</html>
`;
};

module.exports = projectEnquiryTemplate;

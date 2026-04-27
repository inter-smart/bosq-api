const officeChairEnquiryTemplate = ({ customerName = "Customer", enquiryMessage = "", iconsHtml = "" }) => {
  const phone = process.env.COMPANY_PHONE || "+971 56 503 6378";
  const email = process.env.COMPANY_EMAIL || "sales@bosq.ae";
  const contactUrl = `${process.env.CLIENT_BASE_URL}/contact`;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Office Chair Enquiry</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>

<body bgcolor="#FFFFFF" style="margin:0;padding:0;font-family:'Open Sans',sans-serif;">
    <div style="margin:auto; width:700px; background:#ffffff;">
        <table width="700" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:auto;">
            <tbody>
                <tr>
                    <td>

                        <!-- Header -->
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
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

                            <tr>
                                <td style="padding:0 40px 20px;">
                                    <h2 style="font-size:22px; color:#282828; font-weight:500; margin:27px 0 6px; text-align:center;">
                                        Thank You for Your Enquiry
                                    </h2>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px;">
                                    <h2 style="font-size:16px; color:#282828; font-weight:500; text-align:center; margin-bottom:22px;">
                                        Dear ${customerName},
                                    </h2>

                                    <p style="font-size:16px; color:#282828; width:95%; margin:0 auto 24px; line-height:25px; text-align:center;">
                                        We have received your office chair enquiry and appreciate your interest in Bosq.
                                        Our seating specialists are reviewing your requirements and will provide
                                        personalized recommendations for your workspace needs.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <!-- Body -->
                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:0 30px;">

                                    ${
                                      enquiryMessage
                                        ? `
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                        style="padding:20px; background:#F2F2F2; border:1px solid #e5e5e5; margin-bottom:32px;">
                                        <tr>
                                            <td>
                                                <h2 style="font-size:16px; color:#282828; font-weight:500; margin:0 0 12px;">
                                                    Your Office Chair Enquiry:
                                                </h2>
                                                <p style="font-size:16px; color:#282828; line-height:23px; margin:0;">
                                                    ${enquiryMessage}
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                    `
                                        : ""
                                    }

                                    <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                        style="padding:20px; background:#282828; border:1px solid #8e8e8e; margin-bottom:32px;">
                                        <tr>
                                            <td>
                                                <h2 style="font-size:16px; color:#fff; font-weight:500; margin:0 0 12px;">
                                                    What Happens Next?
                                                </h2>
                                                <p style="font-size:16px; color:#fff; line-height:23px; margin:0;">
                                                    Our office seating expert will contact you within 24 hours with tailored
                                                    chair recommendations, pricing, and bulk order options for your workspace.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
                                        <tr>
                                            <td style="text-align:center;">
                                                <a href="${contactUrl}"
                                                   style="display:inline-block; background:#282828; color:#fff; font-size:16px; padding:12px 20px; text-decoration:none; border-radius:3px;">
                                                    Contact Us
                                                </a>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td>
                                                <p style="font-size:16px; color:#282828; text-align:center; margin-top:24px;">
                                                    For immediate assistance with office chair selection, call us at
                                                    <a href="tel:${phone}" style="text-decoration:none; color:#282828;">
                                                        ${phone}
                                                    </a>
                                                    or email
                                                    <a href="mailto:${email}" style="text-decoration:none; color:#282828;">
                                                        ${email}
                                                    </a>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </tbody>

            <!-- Footer -->
            <tfoot>
                <tr>
                    <td style="padding:0;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#282828;">
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

module.exports = officeChairEnquiryTemplate;

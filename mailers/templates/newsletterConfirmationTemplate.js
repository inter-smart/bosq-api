const newsletterConfirmationTemplate = ({ iconsHtml = "" }) => {
  const frontendUrl = process.env.FRONTEND_URL || "#";
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Subscription Confirmed</title>
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
                            style="display:block; margin:0 auto;"
                        />
                    </td>
                </tr>

                <!-- Icon -->
                <tr>
                    <td style="padding:32px 0 10px; text-align:center;">
                        <div style="display:inline-block; width:64px; height:64px; line-height:64px; border:2px solid #282828; border-radius:50%; font-size:28px;">
                            ✓
                        </div>
                    </td>
                </tr>

                <!-- Title -->
                <tr>
                    <td style="padding:10px 40px 12px;">
                        <h2 style="font-size:22px; color:#282828; font-weight:600; margin:0; text-align:center;">
                            Thank You for Staying Connected
                        </h2>
                    </td>
                </tr>

                <!-- Main Copy -->
                <tr>
                    <td style="padding:0 40px 30px;">
                        <p style="font-size:16px; color:#282828; width:90%; margin:0 auto; line-height:25px; text-align:center;">
                            Thank you for your interest in Bosq.
                            Your email has been successfully registered with us.
                        </p>
                    </td>
                </tr>

                <!-- Message Box -->
                <tr>
                    <td style="padding:0 30px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#F2F2F2; border:1px solid #e5e5e5; margin-bottom:32px;">
                            <tr>
                                <td>
                                    <h2 style="font-size:16px; color:#282828; font-weight:500; margin:0 0 12px;">
                                        You're All Set
                                    </h2>

                                    <p style="font-size:14px; color:#444444; line-height:24px; margin:0;">
                                        We appreciate your interest in our brand and workspace solutions.
                                        Should you need assistance with products, project requirements,
                                        or custom workspace solutions, our team is always here to help.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- CTA -->
                <tr>
                    <td style="padding:0 30px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#282828; border:1px solid #8e8e8e; margin-bottom:32px;">
                            <tr>
                                <td style="text-align:center;">
                                    <p style="font-size:14px; color:#cccccc; line-height:24px; margin:0 0 20px;">
                                        Explore our premium workspace furniture and design solutions.
                                    </p>

                                    <a href="${frontendUrl}"
                                        style="display:inline-block; padding:12px 36px; background:#ffffff; color:#282828; text-decoration:none; font-size:14px; font-weight:600; border-radius:3px;">
                                        Visit Website
                                    </a>
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

module.exports = newsletterConfirmationTemplate;

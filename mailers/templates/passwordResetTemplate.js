const passwordResetTemplate = (data, iconsHtml = "") => {
  const currentYear = new Date().getFullYear();

  const { first_name = "User", otp, expiry_minutes = 5 } = data;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Password Reset</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>

<body bgcolor="#FFFFFF" style="margin:0;padding:0;font-family:'Open Sans',sans-serif;">
    <div style="margin:auto; width:700px; background:#ffffff;">
        <table width="700" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:auto;">
            <tbody>

                <!-- Header -->
                <tr>
                    <td>
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
                                    <h2 style="font-size:22px; color:#282828; font-weight:600; margin:27px 0 6px; text-align:center;">
                                        Password Reset Request
                                    </h2>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px;">
                                    <h2 style="font-size:16px; color:#282828; font-weight:500; text-align:center; margin:0 0 22px;">
                                        Hi ${first_name},
                                    </h2>

                                    <p style="font-size:16px; color:#282828; width:95%; margin:0 auto 24px; line-height:25px; text-align:center;">
                                        We received a request to reset your password.
                                        Use the verification code below to complete the process.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td style="padding:0 30px;">

                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#F2F2F2; border:1px solid #e5e5e5; margin-bottom:32px;">
                            <tr>
                                <td style="text-align:center;">
                                    <div style="display:inline-block; padding:20px 40px; background:#ffffff; border:2px dashed #282828;">
                                        <span style="font-size:36px; font-weight:700; letter-spacing:8px; color:#282828;">
                                            ${otp}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#282828; border:1px solid #8e8e8e; margin-bottom:32px;">
                            <tr>
                                <td>
                                    <p style="font-size:16px; color:#ffffff; line-height:23px; margin:0;">
                                        This code will expire in <strong>${expiry_minutes} minutes</strong>.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="margin-bottom:30px;">
                            <tr>
                                <td>
                                    <p style="font-size:14px; color:#282828; line-height:24px; margin:0 0 16px;">
                                        If you didn’t request a password reset, please ignore this email
                                        or contact support if you have concerns.
                                    </p>

                                    <p style="font-size:14px; color:#282828; line-height:24px; margin:0;">
                                        For security reasons, never share this code with anyone.
                                        Our team will never ask you for this code.
                                    </p>
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

module.exports = passwordResetTemplate;

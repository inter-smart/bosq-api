const { emailResponsiveHead, EMAIL_WRAPPER_OPEN, EMAIL_WRAPPER_CLOSE, emailFooter } = require("./emailLayout");

const otpEmailTemplate = (otp, iconsHtml = "") => {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Verification Code</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    ${emailResponsiveHead()}
</head>

<body bgcolor="#FFFFFF" style="margin:0;padding:0;font-family:'Open Sans',sans-serif;">
    ${EMAIL_WRAPPER_OPEN}
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
                                        Verification Code
                                    </h2>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px;">
                                    <p style="font-size:16px; color:#282828; width:95%; margin:0 auto 24px; line-height:25px; text-align:center;">
                                        Use the verification code below to continue.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- OTP Box -->
                <tr>
                    <td class="content-pad" style="padding:0 30px 30px;">
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

                        <p style="font-size:14px; color:#282828; line-height:24px; text-align:center; margin:0;">
                            For security reasons, never share this code with anyone.
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

module.exports = otpEmailTemplate;

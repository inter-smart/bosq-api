const { emailResponsiveHead, EMAIL_WRAPPER_OPEN, EMAIL_WRAPPER_CLOSE, emailFooter } = require("./emailLayout");

const welcomeEmailTemplate = ({ customerName = "Customer", iconsHtml = "" }) => {
  const currentYear = new Date().getFullYear();
  const email = process.env.COMPANY_EMAIL || "sales@bosq.ae";
  const browseUrl = `${process.env.CLIENT_BASE_URL}/products`;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Bosq</title>
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
                                    <h2 style="font-size:22px; color:#282828; font-weight:600; margin:27px 0 6px; line-height:25px; text-align:center;">
                                        Welcome to Bosq !
                                    </h2>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px;">
                                    <h2 style="font-size:16px; color:#282828; font-weight:500; text-align:center; margin:0 0 22px;">
                                        Dear ${customerName},
                                    </h2>

                                    <p style="font-size:16px; color:#282828; width:95%; margin:0 auto 24px; line-height:25px; text-align:center;">
                                        Congratulations! Your account has been successfully created.
                                        You're now part of the Bosq family and have access to our
                                        exclusive collection of premium furniture and design solutions.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Body -->
                <tr>
                    <td class="content-pad" style="padding:0 30px;">

                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="padding:20px; background:#F2F2F2; border:1px solid #e5e5e5; margin-bottom:32px;">
                            <tr>
                                <td>
                                    <h2 style="font-size:16px; color:#282828; font-weight:500; margin:0 0 12px;">
                                        What's Next?
                                    </h2>

                                    <ul style="padding-left:20px; margin:0;">
                                        <li style="font-size:16px; color:#282828; margin-bottom:5px;">
                                            Executive chairs for leadership comfort
                                        </li>
                                        <li style="font-size:16px; color:#282828; margin-bottom:5px;">
                                            Ergonomic task chairs for daily productivity
                                        </li>
                                        <li style="font-size:16px; color:#282828; margin-bottom:5px;">
                                            Conference room seating solutions
                                        </li>
                                        <li style="font-size:16px; color:#282828; margin-bottom:5px;">
                                            Reception and guest seating options
                                        </li>
                                    </ul>
                                </td>
                            </tr>
                        </table>

                        <table width="100%" border="0" cellpadding="0" cellspacing="0"
                            style="margin-bottom:30px;">
                            <tr>
                                <td style="text-align:center;">
                                    <a href="${browseUrl}"
                                        style="display:inline-block; width:142px; background:#282828; border-radius:3px; color:#fff; font-size:16px; font-weight:400; text-align:center; padding:12px 20px; text-decoration:none;">
                                        Browse Products
                                    </a>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <p style="font-size:16px; color:#282828; text-align:center; margin:24px 0 0;">
                                        If you have any questions, feel free to contact our customer service team at
                                        <br />
                                        <a href="mailto:${email}" style="text-decoration:none; color:#282828;">
                                            ${email}
                                        </a>
                                    </p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

            </tbody>
${emailFooter(iconsHtml, currentYear)}
    ${EMAIL_WRAPPER_CLOSE}
</body>
</html>
`;
};

module.exports = welcomeEmailTemplate;

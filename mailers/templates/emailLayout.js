const emailResponsiveHead = () => `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <style>
        @media only screen and (max-width:600px) {
            .email-wrapper { width:100% !important; }
            .content-pad { padding-left:15px !important; padding-right:15px !important; }
        }
    </style>
`;

const EMAIL_WRAPPER_OPEN = `
    <div style="margin:auto; width:100%; max-width:700px; background:#ffffff;">
        <table class="email-wrapper" width="100%" border="0" cellpadding="0" cellspacing="0" align="center" style="max-width:700px; margin:auto;">
            <tbody>
`;

const EMAIL_WRAPPER_CLOSE = `
        </table>
    </div>
`;

const emailFooter = (iconsHtml, currentYear) => `
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
`;

module.exports = { emailResponsiveHead, EMAIL_WRAPPER_OPEN, EMAIL_WRAPPER_CLOSE, emailFooter };

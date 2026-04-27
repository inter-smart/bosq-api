const orderConfirmTemplate = (
  name,
  orderCode,
  orderDate,
  paymentLabel,
  billingline,
  shippingLine,
  items,
  tax_total,
  discount_total,
  subtotal,
  iconsHtml = "",
) => {
  return `
    
<!DOCTYPE html>
<html>

<head>
    <title>emailer</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');
         body,
        p,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            font-family: "Open Sans", sans-serif;
            font-weight: 400;
        }
    </style>

</head>

<body bgcolor="#FFFFFF" leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
    <div style="margin:auto; width:700px;background: #ffffff;">
        <table id="Table_01" width="700" border="0" cellpadding="0" cellspacing="0" align="center">
            <tbody>
                <tr>
                    <td style="padding: 0px 0px 0px;">
                        <table width="700" style="margin: auto;">
                            <tbody>
                                <tr>
                                    <td style="width: 100%; margin: auto;">
                                        <table style="width: 100%; margin: auto;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="display: block; width: 700px; margin: 0 auto; padding: 30px 0; background: #282828; text-align: center;">
                                                        <img src="https://ux.intersmarthosting.in/Mailers/Bosq/logo.png"
                                                            width="132px" height="40" alt="banner"
                                                            style="object-fit: contain;">
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 40px 20px;">
                                        <table width="530" style="margin: auto;">
                                            <tbody>
                                                <td style="text-align:center;padding: 0;">
                                                    <h2
                                                        style="font-size: 22px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0px; margin-top: 27px; margin-bottom: 6px; line-height: 25px; text-align: center;">
                                                        Order Received !
                                                    </h2>
                                                </td>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 30px;">
                                        <table width="640" style="margin: auto 0;">
                                            <tbody>
                                                <td style="text-align:center;padding: 0;">
                                                    <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; text-align: center; margin: 0; margin-bottom: 22px;">
                                                    Dear ${name}, </h2>
                                                    <p
                                                        style="font-size: 16px; color: #282828; font-weight: 400; font-family:  'Open Sans', sans-serif; width: 90%; margin: 0 auto 24px; line-height: 25px; text-align: center;">
                                                        Thank you for choosing Bosq for your office seating needs! We're delighted to confirm that your office chair order has been successfully placed and is now being prepared for delivery.
                                                    </p>
                                                </td>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>


                        <table
                            style="width: 700px;">
                            <tbody>
                                <tr>
                                    <td style="text-align:center;padding: 0;">
                                        <h2
                                            style="font-size: 22px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0px; margin-top: 27px; margin-bottom: 20px; line-height: 25px; text-align: center;">
                                            Order Details
                                        </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        style="margin: auto; padding: 0 30px">
                                        <table
                                            style="width: 100%; margin: auto; height: auto; margin-bottom: 32px; border-collapse: separate; ">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 50%; height: 100%; margin-top: 0px; padding-right: 10px; vertical-align: middle; border-radius: 4px;">
                                                        <div style="background:#F2F2F2; border:1px solid #e5e5e5; padding:20px; height: 100%; min-height: 245px;">
                                                            <h2
                                                                style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0; margin-bottom: 20px;">
                                                            Order Information </h2>
                                                            <table style="width: 100%; border-collapse: collapse;">
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; line-height: 23px; padding-bottom: 25px; width: 45%; vertical-align: top; text-align: left;">Order ID:</td>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; line-height: 23px; padding-bottom: 25px; width: 55%; vertical-align: top; text-align: right; word-break: break-word;">#${orderCode}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; line-height: 23px; padding-bottom: 25px; width: 45%; vertical-align: top; text-align: left;">Order Date:</td>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; line-height: 23px; padding-bottom: 25px; width: 55%; vertical-align: top; text-align: right;">${orderDate}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; line-height: 23px; width: 45%; vertical-align: top; text-align: left;">Payment :</td>
                                                                        <td style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 500; line-height: 23px; width: 55%; vertical-align: top; text-align: right;">${paymentLabel}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>    
                                                    </td>
                                                    <td
                                                        style="width: 50%; height: 100%; margin-top: 0px; padding-right: 10px; vertical-align: middle; border-radius: 4px;">
                                                        <div style="background:#F2F2F2; border:1px solid #e5e5e5; padding:20px; height: 100%; min-height: 245px;">
                                                            <table style="width: 100%; height: 100%; min-height: 240px;">
                                                                <tbody>
                                                                    <!-- TOP CONTENT -->
                                                                    <tr>
                                                                        <td style="vertical-align: top;">
                                                                            <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif;
                                                                                    color: #282828; font-weight: 500; margin-bottom: 12px; margin-top: 0;">
                                                                                Billing Address
                                                                            </h2>
                                                                            <p style="font-size: 16px; color: #282828; font-weight: 400;
                                                                                    font-family:  'Open Sans', sans-serif; line-height: 23px; margin: 0;">
                                                                                ${billingLine}
                                                                            </p>
                                                                        </td>
                                                                    </tr>

                                                                    <!-- BOTTOM CONTENT -->
                                                                    <tr>
                                                                        <td style="vertical-align: bottom;">
                                                                            <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif;
                                                                                    color: #282828; font-weight: 500; margin-bottom: 12px; margin-top: 0;">
                                                                                Shipping Address
                                                                            </h2>
                                                                            <p style="font-size: 16px; color: #282828; font-weight: 400;
                                                                                    font-family:  'Open Sans', sans-serif; line-height: 23px; margin: 0;">
                                                                                ${shippingLine}
                                                                            </p>
                                                                        </td>
                                                                    </tr>

                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        

                                        <table
                                            style="width: 100%; margin: auto; height: 40px; padding: 20px; background-color: #fff; margin-bottom: 30px;border: solid 1px #efeeee;">
                                            <tbody>
                                                <tr>
                                                    <td colspan="3">
                                                        <h2 style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 500; margin: 0; margin-bottom: 10px; white-space: nowrap;">Products (${items.length} Item${items.length !== 1 ? "s" : ""}) </h2>
                                                    </td>
                                                </tr>
                                                ${items
                                                  .map(
                                                    (item) => `
                                                <tr>
                                                    <td style="width: 14%; margin-bottom: 0px; margin-top: 0px;">
                                                        <img src="${item?.image || "https://ux.intersmarthosting.in/Mailers/Bosq/prod-1.png"}" width="66px" height="55" alt="image" style="object-fit: cover;">
                                                    </td>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 5px; margin-top: 0;">
                                                            ${item?.title || "Product"}
                                                        </p>
                                                        ${item?.sku ? `<p style="font-size: 13px; font-family: 'Open Sans', sans-serif; color: #999999; font-weight: 400; margin-bottom: 5px; margin-top: 0;">SKU: ${item.sku}</p>` : ""}
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 5px; margin-top: 0;">
                                                            Qty : ${String(item?.quantity || 0).padStart(2, "0")}
                                                        </p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(item.line_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`,
                                                  )
                                                  .join("")}
                                                <tr>
                                                    <td colspan="3">
                                                        <hr style="border: none; border-top: solid 0.5px #f5f5f5; width: 100%; margin: 15px 0;">
                                                    </td>
                                                </tr>
                                                ${
                                                  parseFloat(subtotal) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Subtotal</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(subtotal).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                ${
                                                  parseFloat(discount_total) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Discount</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #c0392b; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #c0392b; margin: 0px; text-align: right; font-weight: 400;">- AED ${parseFloat(discount_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                ${
                                                  parseFloat(tax_total) > 0
                                                    ? `
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">Tax</p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px; color: #191919; font-weight: 400; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif; font-size: 16px; color: #191919; margin: 0px; text-align: right; font-weight: 400;">AED ${parseFloat(tax_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>`
                                                    : ""
                                                }
                                                <tr>
                                                    <td style="width: 66%; margin-bottom: 0px; margin-top: 0px;" colspan="2">
                                                        <p style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; font-weight: 400; margin-bottom: 0; margin-top: 0;">
                                                            Total Amount <span style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #BBBCBC; font-weight: 400;">( Inc Tax )</span>
                                                        </p>
                                                    </td>
                                                    <td style="width: 20%; font-size: 16px;color: #191919; font-weight: 600; margin-bottom: 0px; margin-top: 0px; line-height: 22px; text-align: right;">
                                                        <p style="font-family: 'Open Sans', sans-serif;font-size: 16px; color: #191919; margin: 0px;text-align: right;font-weight: 400;">AED ${parseFloat(grand_total).toFixed(2)}</p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <table
                                            style="width: 100%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 100%; margin-top: 0px; vertical-align: top;">
                                                        <p
                                                            style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; text-align: center; font-weight: 400; margin: 0; margin-bottom: 0;">
                                                           Your office chairs will be delivered assembled and ready to use with professional setup service included.</a>
                                                           </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <table
                                            style="width: 100%; max-width: 70%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 50%; margin-top: 0px; vertical-align: top;">
                                                        <a href="" style="display: block; font-family: 'Open Sans', sans-serif; text-align: center; width: 142px; height: auto; margin: 0 auto 24px; background-color: #282828;  border-radius: 3px; color: #fff; font-size: 16px; font-weight: 400; line-height: 1; padding: 18px 20px; text-decoration: none;">
                                                            Track Order
                                                        </a>
                                                    </td>
                                                    <td
                                                        style="width: 50%; margin-top: 0px; vertical-align: top;">
                                                        <a href="mailto:sales@bosq.ae" style="display: block; font-family: 'Open Sans', sans-serif; text-align: center; width: 142px; height: auto; margin: 0 auto 24px; background-color: transparent; border: solid 1px #282828; border-radius: 3px; color: #282828; font-size: 16px; font-weight: 400; line-height: 1; padding: 18px 20px; text-decoration: none;">
                                                            Need Help ?
                                                        </a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <table
                                            style="width: 100%; margin: auto; height: auto; border-radius: 15px; margin-bottom: 30px;">
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style="width: 100%; margin-top: 0px; vertical-align: top;">
                                                        <p
                                                            style="font-size: 16px; font-family:  'Open Sans', sans-serif; color: #282828; text-align: center; font-weight: 500; margin: 0; margin-bottom: 0;">
                                                           <span style="color: #282828; font-weight: 400;">For immediate assistance with office chair selection,</span> <br>call us at <a href="tel:971565036378" style="text-decoration: none; color: #282828;">+971 56 503 6378 </a> or email <a href="mailto:sales@bosq.ae" style="text-decoration: none; color: #282828;">sales@bosq.ae</a>
                                                           </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <td style="padding: 0">
                    <table width="700" style="margin: auto;">
                        <tbody>
                            <tr>
                                <td style="text-align:center; padding-top:0; padding-bottom: 0;">
                                    <table align="center"  width="100%" border="0" cellpadding="0" cellspacing="0" style="padding: 20px 30px;  margin: 0; background: #282828">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <table align="center"  width="120" border="0" cellpadding="0" cellspacing="0" style="padding: 0; background: #282828; margin-bottom: 10px;">
                                                        <tbody>
                                                            <tr>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.facebook.com/bosq.ae" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/fb.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                </td>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.instagram.com/bosq.ae" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/insta.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                    </td>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.youtube.com/@BOSQUAE" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/youtube.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                </td>
                                                                <td width="5%"
                                                                    style="padding-left: 0px; text-align: center; padding-left: 0;">
                                                                    <a href="https://www.linkedin.com/company/ayn-musk-furniture-trading-co-llc-bosq-ergonomic-living-uae/?viewAsMember=true" target="_blank"
                                                                        style="text-decoration: none;border-radius: 50%;width: 18px;height: 18px; margin: 0 auto"><img
                                                                            src="https://ux.intersmarthosting.in/Mailers/Bosq/linkedin.png"
                                                                            alt="social" width="14px" height="14px"
                                                                            style="object-fit:contain"></a>
                                                                </td>

                                                            </tr>

                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                 <td>
                                                    <p style="margin: 0; color: #ffffff; font-size: 16px; font-family:  'Open Sans', sans-serif; text-align: center;">© 2025 Bosq. All rights reserved.</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tfoot>
        </table>
    </div>
</body>

</html>
`;
};

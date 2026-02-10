const { singleMediaWithoutType } = require("../mediaButtonHelper")

function buildHeaderSection(cms){
  return {
    primary_media: singleMediaWithoutType(cms, "header_logo_media_path", "header_media_alt", "header_media_alt_ar"),
    secondary_media: singleMediaWithoutType(cms, "footer_logo_media_path", "footer_media_alt", "footer_media_alt_ar")
  }
}

function buildFooterSection(cms) {
  return {
    media: singleMediaWithoutType(
      cms,
      "footer_logo_media_path",
      "footer_media_alt",
      "footer_media_alt_ar"
    ),

    sale_enquiry: {
      title: cms?.sale_enquiry_title,
      title_ar: cms?.sale_enquiry_title_ar,
      phone: cms?.sales_phone_number,
      email: cms?.sale_enquiry_email,
    },

    support_enquiry: {
      title: cms?.support_enquiry_title,
      title_ar: cms?.support_enquiry_title_ar,
      phone: cms?.phone_number,
      email: cms?.support_email,
    },

    newsletter: {
      title: cms?.news_letter_title,
      title_ar: cms?.news_letter_title_ar,
    },

    address_block: {
      address: cms?.address,
      address_ar: cms?.address_ar,
      po_box_number: cms?.po_box_number,
    },
  };
}


function buildFooterIcons(links){
  return links.map(link => ({
    media: singleMediaWithoutType(link, "icon_media_path", "icon_alt", "icon_alt_ar"),
    ...(link?.link ? { link: link.link } : {}),
    
  }))
}




module.exports = {
  buildHeaderSection,
  buildFooterSection,
  buildFooterIcons
}
const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { singleMediaWithoutType } = require("../mediaButtonHelper");

function buildContactData(contactInfo, socialMedia) {
  return {
    media: singleMediaWithoutType(
      contactInfo,
      "media_path",
      "media_alt",
      "media_alt_ar"
    ),
    title: contactInfo.media_title ?? "N/A",
    title_ar: contactInfo.media_title_ar ?? "N/A",
    description: contactInfo.media_description ?? "N/A",
    description_ar: contactInfo.media_description_ar ?? "N/A",
    formData: {
      title: contactInfo.form_title ?? "N/A",
      title_ar: contactInfo.form_title_ar ?? "N/A",
      description: contactInfo.form_description ?? "N/A",
      description_ar: contactInfo.form_description_ar ?? "N/A",
    },

    contactMethods: [
      {
        id: 1,
        type: "email",
        label: contactInfo.email_title ?? "N/A",
        label_ar: contactInfo.email_title_ar ?? "N/A",
        value: contactInfo.email
          ? contactInfo.email
              .split(",") // split by comma
              .map((v) => v.trim()) // remove extra spaces
              .filter(Boolean) // remove empty values
          : [],
      },

      {
        id: 2,
        type: "phone",
        label: contactInfo.phone_title ?? "N/A",
        label_ar: contactInfo.phone_title_ar ?? "N/A",
        value: contactInfo.phone_number
          ? contactInfo.phone_number
              .split(",") // split by comma
              .map((v) => v.trim()) // remove extra spaces
              .filter(Boolean) // remove empty values
          : [],
      },
      {
        id: 3,
        type: "address",
        label: contactInfo.address_title ?? "N/A",
        label_ar: contactInfo.address_title_ar ?? "N/A",
        value: contactInfo.address ? [contactInfo.address] : [],
        value_ar: contactInfo.address_ar ? [contactInfo.address_ar] : [],
      },
    ],

    map: {
      embedUrl: contactInfo.url ?? "N/A",
    },

    socialMedia:
      socialMedia.map((item) => ({
        url: item?.link ?? "",
        media:{
          icon:generateImageUrl(item?.icon_media_path),
          label: item?.icon_alt ?? "",
          label_ar: item?.icon_alt_ar ?? "",
        }
      })) || [],
  };
}

module.exports = {
  buildContactData
};

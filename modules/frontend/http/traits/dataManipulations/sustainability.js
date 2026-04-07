const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { singleMediaWithoutType, singleMediaWithType, mediaWithType, mediaWithoutType } = require("../mediaButtonHelper");

const backendUrl = `${process.env.BASE_URL}/` || "http://localhost:4000/";

function buildSustainabilityData(data, list) {
  return {
    media: {
      ...mediaWithType(
        data,
        "banner_media_type",
        "banner_media_desktop_path",
        "banner_media_mobile_path",
        "banner_media_alt",
        "banner_media_alt_ar"
      ),
      thumbnail: data.banner_media_thumbnail ? `${backendUrl}${data.banner_media_thumbnail}` : null,
    },
    title: data.section1_title ?? "N/A",
    title_ar: data.section1_title_ar ?? "N/A",
    description: data.section1_description ?? "N/A",
    description_ar: data.section1_description_ar ?? "N/A",
    section_media: singleMediaWithoutType(data, "section1_media_path", "section1_media_alt", "section1_media_alt_ar"),
    sections: list.map((item) => ({
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
      media: item?.img1_path ? singleMediaWithoutType(item, "img1_path", "img1_alt", "img1_alt_ar") : null,
    })),
  };
}

module.exports = {
  buildSustainabilityData,
};

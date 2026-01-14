const { singleMediaWithoutType, mediaWithoutType } = require("../mediaButtonHelper");

function buildData(data, list) {
  return {
    media: mediaWithoutType(data, "media_desktop_path", "media_mobile_path", "media_alt", "media_alt_ar"),
    title: data.description ?? "N/A",
    title_ar: data.description_ar ?? "N/A",
    sections: list.map((item, index) => ({
      id: String(index + 1).padStart(2, "0"),
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
      media: singleMediaWithoutType(item, "media_path", "media_alt", "media_alt_ar"),
    })),
  };
}

module.exports = {
  buildData,
};

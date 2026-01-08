const { generateImageUrl } = require("../../../traits/imageUrlHelper");


function buildTitleSection(cmsData, prefix) {
  const getValue = (key) =>
    prefix ? cmsData[`${prefix}_${key}`] : cmsData[key]

   const section = {
    title: getValue("title") ?? "N/A",
    title_ar: getValue("title_ar") ?? "N/A",
  };

  return section;
}


function buildReturnData(cms, policies) {
  return {
    media: {
      type: "image",
      media_path: generateImageUrl(cms.media_path),
      media_alt: cms.media_alt ?? "N/A",
      media_alt_ar: cms.media_alt_ar ?? "N/A",
    },
    items: policies?.map((item, index) => ({
    id: item?.id,

    title: index === 0 ? null : item?.title ?? null,
    title_ar: index === 0 ? null : item?.title_ar ?? null,

    description: item?.description ?? null,
    description_ar: item?.description_ar ?? null,
  })),
  };
}

module.exports = {
  buildReturnData,
  buildTitleSection
};

const { generateImageUrl } = require("../../../traits/imageUrlHelper");

function buildTitleSection(cmsData, prefix) {
  const getValue = (key) =>
    prefix ? cmsData[`${prefix}_${key}`] : cmsData[key]

   const section = {
    title: getValue("title") ?? "N/A",
    title_ar: getValue("title_ar") ?? "N/A",
  };

  const description = getValue("description");
  if (description !== undefined) {
    section.description = description ?? "N/A";
  }

  const descriptionAr = getValue("description_ar");
  if (descriptionAr !== undefined) {
    section.description_ar = descriptionAr ?? "N/A";
  }


  return section;
}




function buildCmsSection(cmsData, prefix, options = {}) {
  const { defaultMediaType = "image", includeMedia = true } = options;

  const get = (key, fallback = "N/A") =>
    cmsData[`${prefix}_${key}`] ?? fallback;

  const section = {
    title: get("title"),
    title_ar: get("title_ar"),
    description: get("description"),
    description_ar: get("description_ar"),
    media:{
      media_type: get("media_type", defaultMediaType),
      media_alt: get("media_alt", null),
      media_alt_ar: get("media_alt_ar", null),
    }
  };

  if (includeMedia) {
    section.media = {
      path: cmsData[`${prefix}_media_path`]
        ? generateImageUrl(cmsData[`${prefix}_media_path`])
        : null,
      alt: get("media_alt", null),
      alt_ar: get("media_alt_ar", null),
    };
  }

  return section;
}




function buildBannerSection(cmsData, prefix, options = {}) {
  const {
    defaultMediaType = "image",
  } = options;

  if (!cmsData || !prefix) return null;

  const get = (key, fallback = null) =>
    cmsData[`${prefix}_${key}`] ?? fallback;

  // Detect media presence from model
  const mediaType = get("media_type", defaultMediaType);
  const desktopPath = get("media_desktop_path");
  const mobilePath = get("media_mobile_path");
  const singlePath = get("media_path");


  const hasMedia =
    !!mediaType &&
    (!!desktopPath || !!mobilePath || !!singlePath);

  const section = {
    title: get("title"),
    title_ar: get("title_ar"),
    description: get("description"),
    description_ar: get("description_ar"),
  };

  // ✅ Include media ONLY if model contains media data
  if (hasMedia) {
    section.media = {
      media_type: mediaType,
      desktopPath: generateImageUrl(desktopPath),
      mobilePath: generateImageUrl(mobilePath),
      media_alt: get("media_alt"),
      media_alt_ar: get("media_alt_ar"),
    };
  }

  return section;
}


function buildOtherMetaData(data){
  return {
    meta_title: data?.meta_title ?? "N/A",
    meta_title_ar: data?.meta_title_ar ?? "N/A",
    meta_description: data?.meta_description ?? "N/A",
    meta_description_ar: data?.meta_description_ar ?? "N/A",
    meta_keywords: data?.meta_keywords ?? "N/A",
    meta_keywords_ar: data?.meta_keywords_ar ?? "N/A",
    other_meta: data?.other_meta ?? "N/A",
    other_meta_ar: data?.other_meta_ar ?? "N/A",
  };
}



module.exports = {
  buildTitleSection,
  buildCmsSection,
  buildBannerSection,
  buildOtherMetaData
};

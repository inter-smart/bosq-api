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
    media_type: get("media_type", defaultMediaType),
    media_alt: get("media_alt", null),
    media_alt_ar: get("media_alt_ar", null),
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

module.exports = {
  buildTitleSection,
  buildCmsSection,
};

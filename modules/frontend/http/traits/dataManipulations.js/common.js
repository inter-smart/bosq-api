const { generateImageUrl } = require("../../../traits/imageUrlHelper");

function buildTitleSection(cmsData, prefix) {
  const section = {
    title: cmsData[`${prefix}_title`] ?? "N/A",
    title_ar: cmsData[`${prefix}_title_ar`] ?? "N/A",
  };

  // Add description only if present
  if (cmsData[`${prefix}_description`] !== undefined) {
    section.description = cmsData[`${prefix}_description`] ?? "N/A";
  }

  if (cmsData[`${prefix}_description_ar`] !== undefined) {
    section.description_ar = cmsData[`${prefix}_description_ar`] ?? "N/A";
  }

  return section;
}

function buildCmsSection(cmsData, prefix, options = {}) {
  const { defaultMediaType = "image", includeMedia = true } = options;

  const get = (key, fallback = "N/A") => cmsData[`${prefix}_${key}`] ?? fallback;

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
      path: cmsData[`${prefix}_media_path`] ? generateImageUrl(cmsData[`${prefix}_media_path`]) : null,
    };
  }

  return section;
}

module.exports = {
  buildTitleSection,
  buildCmsSection,
};

const { generateImageUrl } = require("../../../traits/imageUrlHelper");

function buildProjectData(cms) {
  return {
    ew: "weqeq",
  };
}

function buildProjectBannerSection(cmsData) {
  const section = {
    title: cmsData.banner_title ?? "",
    title_ar: cmsData.banner_title_ar ?? "",
    description: cmsData.description ?? "",
    description_ar: cmsData.description_ar ?? "",
    media: {
      media_type: cmsData.media_type ?? null,
      desktop_path: generateImageUrl(cmsData.media_desktop_path) ?? null,
      mobile_path: generateImageUrl(cmsData.media_mobile_path) ?? null,
      media_alt: cmsData.media_alt ?? "",
      media_alt_ar: cmsData.media_alt_ar ?? "",
    },
  };
  return section;
}

function buildProjectCategorySection(data) {
  const section = {
    list: data.map((item) => ({
      title: item.name ?? "",
      title_ar: item.name_ar ?? "",
      slug: item.slug ?? "",
    })),
  };
  return section;
}

// buildProjectListSection

function buildProjectListSection(data) {
  const section = data.map((item) => ({
    title: item.title ?? "",
    title_ar: item.title_ar ?? "",
    slug: item.slug ?? "",
    thumbnail: generateImageUrl(item.thumbnail),
  }));

  return section;
}

module.exports = {
  buildProjectData,
  buildProjectCategorySection,
  buildProjectBannerSection,
  buildProjectListSection,
};

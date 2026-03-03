const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { buildCmsSection } = require("./common");

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
    id: item.id,
    title: item.title ?? "",
    title_ar: item.title_ar ?? "",
    slug: item.slug ?? "",
    media: {
      media_path: generateImageUrl(item?.thumbnail),
      media_alt: item.title ?? "",
      media_alt_ar: item.title_ar ?? "",
    },
  }));

  return section;
}

function buildProjectDetailsSection(data) {
  const section = {
    id: data?.id,
    title: data?.title,
    title_ar: data?.title_ar,
    tags: Array.isArray(data?.tags) ? data.tags : [],
    tags_ar: Array.isArray(data?.tags_ar) ? data.tags_ar : [],
    description: data?.description,
    description_ar: data?.description_ar,
    media: {
      media_type: data?.media_type ?? null,
      desktop_path: generateImageUrl(data?.section1_desktop_media_path) ?? null,
      mobile_path: generateImageUrl(data?.section1_mobile_media_path) ?? null,

      media_alt: data?.section1_media_alt ?? "",
      media_alt_ar: data?.section1_media_alt_ar ?? "",
    },
    features: data?.features.map((item) => ({
      label: item?.label ?? "",
      value: item?.value ?? "",
    })),
    features_ar: data?.features_ar.map((item) => ({
      label: item?.label ?? "",
      value: item?.value ?? "",
    })),

    projectGallery: data?.project_images.map((item) => ({
      media: {
        media_type: item?.media_type ?? null,
        media_path: generateImageUrl(item?.media_path) ?? null,
        media_alt: item?.media_alt ?? "",
        media_alt_ar: item?.media_alt_ar ?? "",
      },
    })),
  };

  return section;
}

// buildProjectGallerySection

function buildProfileTitleSection(data) {
  console.log("ccf", data);
  const section = {
    title: data?.title ?? "",
    title_ar: data?.title_ar ?? "",
  };

  return section;
}

function buildSpecialisedAreaSection(project) {
  const areas = Array.isArray(project?.specialised_areas) ? project.specialised_areas : [];

  return {
    title: project?.section4_title ?? "",
    title_ar: project?.section4_title_ar ?? "",
    items: areas
      .filter((item) => item.status)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.id,
        media: {
          media_type: "image",
          media_path: generateImageUrl(item?.media_path),
          media_alt: item.media_alt ?? "",
          media_alt_ar: item.media_alt_ar ?? "",
        },
        title: item.title ?? "",
        title_ar: item.title_ar ?? "",
      })),
  };
}

module.exports = {
  buildProjectData,
  buildProjectCategorySection,
  buildProjectBannerSection,
  buildProjectListSection,
  buildProjectDetailsSection,
  buildProfileTitleSection,
  buildSpecialisedAreaSection,
};

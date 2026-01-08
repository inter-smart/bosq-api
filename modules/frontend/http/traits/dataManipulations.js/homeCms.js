const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { buildTitleSection } = require("./common");

function buildHomeBannerSliders(banners) {
  if (!Array.isArray(banners) || banners.length === 0) {
    return null;
  }

  const sliders = banners?.map((banner) => {
    return {
      id: banner?.id,
      title: banner?.title ?? "N/A",
      title_ar: banner?.title_ar ?? "N/A",
      description: banner?.description ?? "N/A",
      description_ar: banner?.description_ar ?? "N/A",
      media_type: banner?.media_type ?? "image",
      media_alt: banner?.media_alt ?? null,
      media_alt_ar: banner?.media_alt_ar ?? null,
      media: {
        desktop: {
          path: generateImageUrl(banner?.media_desktop_path) ?? null,
        },
        mobile: {
          path: generateImageUrl(banner?.media_mobile_path) ?? null,
        },
      },
      button: {
        label: banner?.button_text ?? "N/A",
        label_ar: banner?.button_text_ar ?? "N/A",
        link: banner?.link ?? "#",
      },
    };
  });

  return sliders;
}

function buildProjectsSection(projects, cmsData) {
  const meta = buildTitleSection(cmsData, "project");

  return {
    ...meta,
    list: projects?.map((project) => {
      return {
        id: project?.id,
        title: project?.title ?? "N/A",
        title_ar: project?.title_ar ?? "N/A",
        media_alt: project?.title ?? "N/A",
        media_alt_ar: project?.title_ar ?? "N/A",
        media: generateImageUrl(project?.thumbnail) ?? null,
      };
    }),
  };
}

function buildJourneySection(cmsData, prefix, options = {}) {
  const { defaultMediaType = "image", includeMedia = true } = options;

  const get = (key, fallback = "N/A") =>
    cmsData[`${prefix}_${key}`] ?? fallback;

  const section = {
    title: get("title"),
    title_ar: get("title_ar"),
    description: get("description"),
    description_ar: get("description_ar"),
    media_type: get("media_type", defaultMediaType),
  };

  if (includeMedia) {
    section.media = {
      desktop: {
        path: cmsData[`${prefix}_media_desktop_path`]
          ? generateImageUrl(cmsData[`${prefix}_media_desktop_path`])
          : null,
        alt: get("media_alt", null),
        alt_ar: get("media_alt_ar", null),
      },
      mobile: {
        path: cmsData[`${prefix}_media_mobile_path`]
          ? generateImageUrl(cmsData[`${prefix}_media_mobile_path`])
          : null,
        alt: get("media_alt", null),
        alt_ar: get("media_alt_ar", null),
      },
    };
  }

  return section;
}

function buildFitsSection(cmsData, fits) {
  const meta = buildTitleSection(cmsData, "fits");

  return {
    ...meta,
    button:{
      label: cmsData?.fits_button_text ?? "View All projects",
      label_ar: cmsData?.fits_button_text_ar ?? "عرض جميع المشاريع",
      link: cmsData?.fits_button_link ?? "/",
    },
    projects: fits.map((fit) => {
      return {
        id: fit?.id,
        media:{
          path: generateImageUrl(fit?.media_path) ?? null,
          alt: fit?.media_alt ?? "N/A",
          alt_ar: fit?.media_alt_ar ?? "N/A",
        },
        title: fit?.title ?? "N/A",
        title_ar: fit?.title_ar ?? "N/A",
        description: fit?.description ?? "N/A",
        description_ar: fit?.description_ar ?? "N/A",
        button:{
          label: fit?.button_text ?? "View Details",
          label_ar: fit?.button_text_ar ?? "عرض التفاصيل",
          link: fit?.link ?? "/",
        }
      };
    }),
  };
}

module.exports = {
  buildHomeBannerSliders,
  buildProjectsSection,
  buildJourneySection,
  buildFitsSection,
};

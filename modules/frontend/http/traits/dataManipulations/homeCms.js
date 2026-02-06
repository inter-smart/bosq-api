const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { buildTitleSection } = require("./common");
const { singleMediaWithoutType } = require("../mediaButtonHelper");

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
          alt: banner?.media_alt ?? null,
          alt_ar: banner?.media_alt_ar ?? null,
        },
        mobile: {
          path: generateImageUrl(banner?.media_mobile_path) ?? null,
          alt: banner?.media_alt ?? null,
          alt_ar: banner?.media_alt_ar ?? null,
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
        slug: project?.slug ?? "N/A",
        media: {
          path: generateImageUrl(project?.thumbnail) ?? null,
          type: project?.type ?? "image",
          alt: project?.title ?? "N/A",
          alt_ar: project?.title_ar ?? "N/A",
        },
      };
    }),
  };
}

//  media: {
//     media_type: "image",
//     media_path: "/images/home-calculator-1.png",
//     media_alt: "home-calculator-1",
//   },
//   title: "Smart Space Calculator",
//   description:
//     "<p>The BOSQ UAE you see today has deep roots in India, where we began our journey in 2012 crafting ergonomic seating solutions for leading corporations. Fueled by a deep understanding of design trends and a spirit of innovation, we’ve established ourselves as a provider of top-quality office furniture and workspace solutions.</p>",

function buildSmartSpaceCalculatorSection(data) {
  const section = {
    list: data?.map((item) => ({
      media: singleMediaWithoutType(
        item,
        "media_path",
        "media_alt",
        "media_alt_ar",
      ),
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
      button: {
        type: "link",
        label: item?.button_text ?? "N/A",
        label_ar: item?.button_text_ar ?? "N/A",
        link: item?.link ?? "#",
      },
    })),
  };

  return section;
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

function buildFeaturedProductSection(cms, data) {
  const titleSection = buildTitleSection(cms, "featured");
  const section = {
    ...titleSection,
    list: data?.map((item) => ({
      media: singleMediaWithoutType(item, "media_path", "name", "name_ar"),
      name: item?.name,
      name_ar: item?.name_ar,
      slug: item?.slug,
    })),
  };

  return section;
}

function buildBrandSection(cmsData, brands) {
  const meta = buildTitleSection(cmsData, "brands");

  return {
    ...meta,
    list: brands?.map((brand) => {
      return {
        id: brand?.id,
        title: brand?.title ?? "N/A",
        title_ar: brand?.title_ar ?? "N/A",
        media: {
          path: generateImageUrl(brand?.media_path) ?? null,
          type: brand?.type ?? "image",
          alt: brand?.title ?? "N/A",
          alt_ar: brand?.title_ar ?? "N/A",
        },
      };
    }),
  };
}

function buildFitsSection(cmsData, fits) {
  const meta = buildTitleSection(cmsData, "fits");

  return {
    ...meta,
    button: {
      label: cmsData?.fits_button_text ?? "View All projects",
      label_ar: cmsData?.fits_button_text_ar ?? "عرض جميع المشاريع",
      link: cmsData?.fits_button_link ?? "/",
    },
    projects: fits.map((fit) => {
      return {
        id: fit?.id,
        media: {
          path: generateImageUrl(fit?.media_path) ?? null,
          alt: fit?.media_alt ?? "N/A",
          alt_ar: fit?.media_alt_ar ?? "N/A",
        },
        title: fit?.title ?? "N/A",
        title_ar: fit?.title_ar ?? "N/A",
        description: fit?.description ?? "N/A",
        description_ar: fit?.description_ar ?? "N/A",
        button: {
          label: fit?.button_text ?? "View Details",
          label_ar: fit?.button_text_ar ?? "عرض التفاصيل",
          link: fit?.link ?? "/",
        },
      };
    }),
  };
}

module.exports = {
  buildHomeBannerSliders,
  buildProjectsSection,
  buildSmartSpaceCalculatorSection,
  buildFeaturedProductSection,
  buildJourneySection,
  buildFitsSection,
  buildBrandSection,
};

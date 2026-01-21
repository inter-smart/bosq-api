const aboutCms = require("../../../../../database/models/cms/about/aboutCms");
const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { singleMediaWithoutType } = require("../mediaButtonHelper");
const { buildTitleSection, buildBannerSection } = require("./common");


function buildABoutBannerSection(aboutCms){
  const meta = buildBannerSection(aboutCms, "banner");


  return {
    ...meta,
    button: {
      label: aboutCms?.banner_button_text ?? "N/A",
      label_ar: aboutCms?.banner_button_text_ar ?? "N/A",
      link: aboutCms?.banner_button_link ?? "N/A",
    }
  }
}
function buildJOurneySection(aboutCms, items) {
  const meta = buildTitleSection(aboutCms, "journey");
  const journeyMediaConfig = [
    {
      path: generateImageUrl(aboutCms?.journey_one_media_path),
      alt: aboutCms?.journey_one_media_alt,
      alt_ar: aboutCms?.journey_one_media_alt_ar,
    },
    {
      path: generateImageUrl(aboutCms?.journey_two_media_path),
      alt: aboutCms?.journey_two_media_alt,
      alt_ar: aboutCms?.journey_two_media_alt_ar,
    },
    {
      path: generateImageUrl(aboutCms?.journey_three_media_path),
      alt: aboutCms?.journey_three_media_alt,
      alt_ar: aboutCms?.journey_three_media_alt_ar,
    },
  ];

  return {
    ...meta,
    journey_list: items.map((item) => ({
      id: item?.id,
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
    })),
    imageGrid_list: journeyMediaConfig
      .filter((media) => media?.path)
      .map((media, index) => ({
        id: index + 1,
        media: {
          type: "image",
          path: media.path,
          alt: media.alt ?? "journey-image",
          alt_ar: media.alt_ar ?? "journey-image",
        },
      })),
  };
}

function buildBosqSection(aboutCms, whyBosq) {
  const meta = buildTitleSection(aboutCms, "why_choose_us");

  return {
    ...meta,
    bosqList: whyBosq?.map((item) => ({
      id: item?.id,
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
      caption: item?.subtitle ?? "N/A",
      caption_ar: item?.subtitle_ar ?? "N/A",
      media: singleMediaWithoutType(item, "media_path", "media_alt", "media_alt_ar"),
      icon: singleMediaWithoutType(item, "icon_media_path", "icon_media_alt", "icon_media_alt_ar"),
    }))
  };
}


function buildTestimonialSection(aboutCms, aboutTestimonials) {
  const meta = buildTitleSection(aboutCms, "testimonial");

  return{
    ...meta,
    list: aboutTestimonials?.map((item) => ({
      id: item?.id,
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
      name: item?.name ?? "N/A",
      name_ar: item?.name_ar ?? "N/A",
      designation: item?.designation ?? "N/A",
      designation_ar: item?.designation_ar ?? "N/A",      
    }))
  }
}


function buildClientSection(aboutCms, aboutOurClients) {
  const meta = buildTitleSection(aboutCms, "client");

  return{
    ...meta,
    list: aboutOurClients?.map((item) => ({
      id: item?.id,
     media: singleMediaWithoutType(item, "media_path", "title", "title_ar")
    }))
  }
}

function buildNewsSection(aboutCms, aboutNews) {
  const meta = buildTitleSection(aboutCms, "news");

  return{
    ...meta,
    list: aboutNews?.map((item) => ({
      id: item?.id,
      name: item?.name ?? "N/A",
      name_ar: item?.name_ar ?? "N/A",
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      slug: item?.slug ?? "N/A",
      date: formatNewsDate(item?.published_date) ?? "N/A",
     media: singleMediaWithoutType(item, "thumbnail", "thumbnail_alt", "thumbnail_alt_ar")
    }))
  }
}

function formatNewsDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short", // Tue
    day: "2-digit",   // 13
    month: "short",   // Aug
    year: "numeric",  // 2024
  });
}

module.exports = {
  buildJOurneySection,
  buildBosqSection,
  buildTestimonialSection,
  buildClientSection,
  buildNewsSection,
  buildABoutBannerSection
};

const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { buildCmsSection, buildTitleSection } = require("./common");

function buildDeliveryData(cmsData, deliveryMethods) {
  const result = {
    media: {
      type: "image",
      desktopPath: generateImageUrl(cmsData?.banner_media_desktop_path),
      mobilePath: generateImageUrl(cmsData?.banner_media_mobile_path),
      desktopPath_ar: generateImageUrl(cmsData?.banner_media_desktop_path_ar),
      mobilePath_ar: generateImageUrl(cmsData?.banner_media_mobile_path_ar),
      media_alt: cmsData?.banner_media_alt ?? "N/A",
      media_alt_ar: cmsData?.banner_media_alt_ar ?? "N/A",
    },
    title: cmsData?.banner_title ?? "N/A",
    title_ar: cmsData?.banner_title_ar ?? "N/A",
    // description: cmsData?.banner_description ?? "N/A",
    // description_ar: cmsData?.banner_description_ar ?? "N/A",
    items: deliveryMethods?.map((item) => ({
      id: item?.id,
      media: {
        type: "image",
        media_path: generateImageUrl(item?.media_path),
        media_alt: item?.media_alt ?? "N/A",
        media_alt_ar: item?.media_alt_ar ?? "N/A",
      },
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
    })),
  };

  return result;
}

function buildDeliveryInfo(cmsData, deliveryTime) {
  const result = {
    media: {
      type: "image",
      media_path: generateImageUrl(cmsData?.delivery_media_path),
      media_alt: cmsData?.delivery_media_alt ?? "N/A",
      media_alt_ar: cmsData?.delivery_media_alt_ar ?? "N/A",
    },
    title: cmsData?.delivery_time_title ?? "N/A",
    title_ar: cmsData?.delivery_time_title_ar ?? "N/A",

    description: cmsData?.delivery_time_subtitle ?? "N/A",
    description_ar: cmsData?.delivery_time_subtitle_ar ?? "N/A",

    items: deliveryTime?.map((item) => ({
      media_path: generateImageUrl(item?.icon_media_path),
      title: item?.duration ?? "N/A",
      title_ar: item?.duration_ar ?? "N/A",
      description: item?.title ?? "N/A",
      description_ar: item?.title_ar ?? "N/A",
    })),
  };

  return result;
}

function buildProcessSection(cmsData, process) {
  const meta = buildCmsSection(cmsData, "process");
  const result = {
    ...meta,
    items: process?.map((item) => ({
      id: item?.id,
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
    })),
  };

  return result;
}

function buildOptionsSection(cmsData, options){
  const meta = buildTitleSection(cmsData, "options");
  const result = {
    ...meta,
     items: options?.map((item) => ({
      id: item?.id,
      media: {
        type: "image",
        media_path: generateImageUrl(item?.media_path),
        media_alt: item?.media_alt ?? "N/A",
        media_alt_ar: item?.media_alt_ar ?? "N/A",
      },
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
    })),
  }
  return result
}


function buildOptionsValue(options){
  const result = {
     items: options?.map((item) => ({
      id: item?.id,
      title: item?.title ?? "N/A",
    })),
  }
  return result
}


function buildrequestCustomQuoteSection(cmsData, options){
  const meta = buildTitleSection(cmsData, "options");
  const result = {
    ...meta,
     items: options?.map((item) => ({
      id: item?.id,
      media: {
        type: "image",
        media_path: generateImageUrl(item?.media_path),
        media_alt: item?.media_alt ?? "N/A",
        media_alt_ar: item?.media_alt_ar ?? "N/A",
      },
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.points ?? "N/A",
      description_ar: item?.points_ar ?? "N/A",
    })),
  }
  return result
}


module.exports = {
  buildDeliveryData,
  buildDeliveryInfo,
  buildProcessSection,
  buildOptionsSection,
  buildrequestCustomQuoteSection,
buildOptionsValue

};

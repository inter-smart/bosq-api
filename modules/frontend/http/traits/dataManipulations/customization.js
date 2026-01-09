const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { singleMediaWithoutType } = require("../mediaButtonHelper");

function buildFeaturesSection(feature){
   return feature.map((item) => ({
      id: item?.id,
      media: {
        type: item?.media_type ?? "image",
        media_path: generateImageUrl(item?.media_path),
        media_alt: item?.title ?? "N/A",
        media_alt_ar: item?.title_ar ?? "N/A",
      },
      title: item?.title ?? "N/A",
      title_ar: item?.title_ar ?? "N/A",
      description: item?.description ?? "N/A",
      description_ar: item?.description_ar ?? "N/A",
    }));
}



module.exports ={
   buildFeaturesSection
}
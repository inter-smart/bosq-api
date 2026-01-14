const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { buildBannerSection } = require("./common");

function buildMaterialInfoSection(cmsData, materials = [], categories = []) {
  const meta = buildBannerSection(cmsData, "banner");

  return {
    ...meta,
    items: categories
      .map((category) => {
        const categoryMaterials = materials.filter(
          (material) => material.category === category.id
        );

        // ❌ skip category if no materials
        if (categoryMaterials.length === 0) {
          return null;
        }

        return {
          id: category.id,

          title: category.title ?? null,
          title_ar: category.title_ar ?? null,

          info_list: categoryMaterials.map((material) => ({
            title: material?.title ?? "N/A",
            title_ar: material?.title_ar ?? "N/A",

            description: material?.description ?? null,
            description_ar: material?.description_ar ?? null,

            media: {
              type: "image",
              path: generateImageUrl(material?.media_path),
              alt: material?.media_alt ?? "N/A",
              alt_ar: material?.media_alt_ar ?? "N/A",
            },

            icon: material?.icon_path
              ? {
                  type: "image",
                  path: generateImageUrl(material.icon_path),
                  alt: material?.title ?? "icon",
                }
              : null,
          })),
        };
      })
      .filter(Boolean), // 🧹 remove null categories
  };
}


function buildExtraMaterialsSection( materials = []) {
  return {
      info_list: materials
        .map((material) => ({
          title: material?.title ?? "N/A",
          title_ar: material?.title_ar ?? "N/A",

          description: material?.description ?? null,
          description_ar: material?.description_ar ?? null,

          media: {
            type: "image",
            path: generateImageUrl(material?.media_path),
            alt: material?.media_alt ?? "N/A",
            alt_ar: material?.media_alt_ar ?? "N/A",
          },

          icon: material?.icon_path
            ? {
                type: "image",
                path: generateImageUrl(material.icon_path),
                alt: material?.title ?? "icon",
              }
            : null,
        })),
  };
}

module.exports = {
  buildMaterialInfoSection,
  buildExtraMaterialsSection
};

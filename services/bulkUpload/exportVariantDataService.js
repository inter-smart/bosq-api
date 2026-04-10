const path = require("path");
const { models } = require("../../database/models");
const { ProductVariants, ProductModels, ProductBase, ProductAttribute, AttributeValues, ProductVariantImages, ProductProjectImage } = models;

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

function isVideo(filePath) {
  if (!filePath) return false;
  return VIDEO_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function basename(filePath) {
  if (!filePath) return "";
  return path.basename(filePath);
}

/**
 * Fetches full export data for a list of variant IDs.
 * Returns { bases, models, variants } structured for client-side Excel generation.
 *
 * @param {number[]} variantIds
 * @returns {Promise<{ bases: object[], models: object[], variants: object[] }>}
 */
async function getExportData(variantIds) {
  const rows = await ProductVariants.findAll({
    where: { id: variantIds },
    include: [
      {
        model: ProductModels,
        as: "productModel",
        attributes: ["id", "title", "title_ar", "code", "base_price", "sort_order", "status", "media_path"],
        include: [
          {
            model: ProductBase,
            as: "product",
            attributes: ["id", "title", "title_ar", "sort_order", "status"],
          },
        ],
      },
      {
        model: models.ProductCategory,
        as: "categories",
        attributes: ["slug"],
        through: { attributes: [] },
      },
      {
        model: models.ProductVariantAttributes,
        as: "variant_attributes",
        attributes: ["id", "price"],
        include: [
          {
            model: ProductAttribute,
            attributes: ["slug"],
          },
          {
            model: AttributeValues,
            attributes: ["slug"],
          },
        ],
      },
      {
        model: ProductVariantImages,
        as: "variant_images",
        attributes: ["media_path", "thumbnail_path", "media_type", "sort_order"],
      },
      {
        model: ProductProjectImage,
        as: "projectImages",
        attributes: ["media_path", "sort_order"],
      },
    ],
    order: [
      ["id", "ASC"],
      [{ model: models.ProductVariantAttributes, as: "variant_attributes" }, "id", "ASC"],
      [{ model: ProductVariantImages, as: "variant_images" }, "sort_order", "ASC"],
      [{ model: ProductProjectImage, as: "projectImages" }, "sort_order", "ASC"],
    ],
  });

  const seenBases = new Map(); // base title → base row object
  const seenModels = new Map(); // "base_title||model_title" → model row object
  const variantRows = [];

  for (const v of rows) {
    const model = v.productModel;
    const base = model?.product;

    if (!model || !base) continue;

    const baseTitle = base.title || "";
    const modelTitle = model.title || "";

    // ── Deduplicate base rows ───────────────────────────────────────────────
    if (!seenBases.has(baseTitle)) {
      seenBases.set(baseTitle, {
        title: base.title ?? "",
        title_ar: base.title_ar ?? "",
        sort_order: base.sort_order ?? 1,
        status: base.status ?? true,
      });
    }

    // ── Deduplicate model rows ──────────────────────────────────────────────
    const modelKey = `${baseTitle}||${modelTitle}`;
    if (!seenModels.has(modelKey)) {
      seenModels.set(modelKey, {
        base_title: baseTitle,
        title: model.title ?? "",
        title_ar: model.title_ar ?? "",
        code: model.code ?? "",
        base_price: model.base_price ?? "",
        sort_order: model.sort_order ?? 1,
        status: model.status ?? true,
        media_path: basename(model.media_path),
      });
    }

    // ── Categories ─────────────────────────────────────────────────────────
    const categories = (v.categories || [])
      .map((c) => c.slug)
      .filter(Boolean)
      .join(",");

    // ── Attributes ─────────────────────────────────────────────────────────
    const attributes = (v.variant_attributes || [])
      .map((va) => {
        const attrSlug = va.ProductAttribute?.slug;
        const valueSlug = va.AttributeValue?.slug;
        if (!attrSlug || !valueSlug) return null;
        const price = Number(va.price) || 0;
        return `${attrSlug}:${valueSlug}:${price}`;
      })
      .filter(Boolean)
      .join("|");

    // ── Gallery images (ProductVariantImages) ───────────────────────────────
    const galleryImages = v.variant_images || [];
    const imagesStr = galleryImages
      .map((img) => basename(img.media_path))
      .filter(Boolean)
      .join(",");

    // Video thumbnails: one per video, in order of appearance in gallery
    const videoThumbnails = galleryImages
      .filter((img) => isVideo(img.media_path) || img.media_type === "video")
      .map((img) => basename(img.thumbnail_path))
      .filter(Boolean)
      .join(",");

    // ── Project images ──────────────────────────────────────────────────────
    const projectImages = (v.projectImages || [])
      .map((img) => basename(img.media_path))
      .filter(Boolean)
      .join(",");

    variantRows.push({
      base_title: baseTitle,
      model_title: modelTitle,
      product_code: v.product_code ?? "",
      title: v.title ?? "",
      title_ar: v.title_ar ?? "",
      design_title: v.design_title ?? "",
      design_title_ar: v.design_title_ar ?? "",
      stock: v.stock ?? "",
      is_featured: v.is_featured ?? false,
      sort_order: v.sort_order ?? 1,
      status: v.status ?? true,
      categories,
      attributes,
      description: v.description ?? "",
      description_ar: v.description_ar ?? "",
      enhance_title: v.enhance_title ?? "",
      enhance_title_ar: v.enhance_title_ar ?? "",
      details: v.details ?? "",
      details_ar: v.details_ar ?? "",
      details_points: v.details_points ?? "",
      details_points_ar: v.details_points_ar ?? "",
      additional_details: v.additional_details ?? "",
      additional_details_ar: v.additional_details_ar ?? "",
      cover_image: basename(v.media_path),
      hover_image: basename(v.hover_media_path),
      brochure: basename(v.brochure),
      images: imagesStr,
      video_thumbnails: videoThumbnails,
      project_images: projectImages,
    });
  }

  return {
    bases: Array.from(seenBases.values()),
    models: Array.from(seenModels.values()),
    variants: variantRows,
  };
}

module.exports = { getExportData };

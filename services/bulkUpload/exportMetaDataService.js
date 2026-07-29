const { models } = require("../../database/models");
const { ProductVariants, ProductMeta } = models;

const META_FIELDS = [
  "meta_title",
  "meta_title_ar",
  "meta_description",
  "meta_description_ar",
  "meta_keywords",
  "meta_keywords_ar",
  "other_meta",
  "other_meta_ar",
];

/**
 * Fetches pre-filled meta export rows for a list of variant IDs.
 * Returns one row per variant with sku, product_title (reference-only), and
 * current meta field values (blank if the variant has no ProductMeta row yet).
 *
 * @param {number[]} variantIds
 * @returns {Promise<object[]>}
 */
async function getMetaExportData(variantIds) {
  const variants = await ProductVariants.findAll({
    where: { id: variantIds },
    attributes: ["id", "sku", "title"],
    include: [{ model: ProductMeta, as: "meta" }],
    order: [["id", "ASC"]],
  });

  return variants.map((v) => {
    const meta = v.meta;
    const row = {
      sku: v.sku ?? "",
      product_title: v.title || v.sku || "",
    };
    META_FIELDS.forEach((field) => {
      row[field] = meta?.[field] ?? "";
    });
    return row;
  });
}

module.exports = { getMetaExportData };

const { models, sequelize } = require("../../database/models");
const Logger = require("../../config/logger");

const {
  ProductBase,
  ProductModels,
  ProductVariants,
  ProductVariantCategories,
  ProductVariantAttributes,
} = models;

const BATCH_SIZE = 500;

/**
 * Splits an array into chunks of the given size.
 */
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Processes the validated bulk upload hierarchy within a single DB transaction.
 *
 * Insertion order:
 *   1. ProductBase (all)          → build baseSlugToId map
 *   2. ProductModels (all)        → build modelKeyToId map ("baseSlug:modelSlug")
 *   3. ProductVariants (all)      → build variantIndexToId map
 *   4. ProductVariantCategories   → junction rows
 *   5. ProductVariantAttributes   → junction rows
 */
async function processUpload(hierarchy) {
  const { bases } = hierarchy;

  return sequelize.transaction(async (t) => {
    // ── 1. Insert ProductBase ────────────────────────────────────────────────
    const baseDataRows = bases.map((b) => ({
      ...b.data,
      status: b.data.status ?? true,
      sort_order: b.data.sort_order ?? 1,
    }));

    Logger.info(`[BulkUpload] Inserting ${baseDataRows.length} product_base rows`);
    const insertedBases = [];
    for (const batchRows of chunk(baseDataRows, BATCH_SIZE)) {
      const result = await ProductBase.bulkCreate(batchRows, {
        transaction: t,
        returning: true,
      });
      insertedBases.push(...result);
    }

    // Build slug → real DB id map
    const baseSlugToId = new Map();
    insertedBases.forEach((b, idx) => {
      baseSlugToId.set(bases[idx].data.slug, b.id);
    });

    // ── 2. Insert ProductModels ──────────────────────────────────────────────
    const allModelRows = [];
    const modelMeta = []; // track { baseSlug, modelSlug } for map building

    for (const base of bases) {
      const productId = baseSlugToId.get(base.data.slug);
      for (const model of base.models) {
        allModelRows.push({
          ...model.data,
          product_id: productId,
          status: model.data.status ?? true,
          sort_order: model.data.sort_order ?? 1,
        });
        modelMeta.push({ baseSlug: base.data.slug, modelSlug: model.data.slug });
      }
    }

    Logger.info(`[BulkUpload] Inserting ${allModelRows.length} product_model rows`);
    const insertedModels = [];
    for (const batchRows of chunk(allModelRows, BATCH_SIZE)) {
      const result = await ProductModels.bulkCreate(batchRows, {
        transaction: t,
        returning: true,
      });
      insertedModels.push(...result);
    }

    // Build "baseSlug:modelSlug" → real model DB id map
    const modelKeyToId = new Map();
    insertedModels.forEach((m, idx) => {
      const { baseSlug, modelSlug } = modelMeta[idx];
      modelKeyToId.set(`${baseSlug}:${modelSlug}`, m.id);
    });

    // ── 3. Insert ProductVariants ────────────────────────────────────────────
    const allVariantRows = [];
    const variantMeta = []; // track { categoryIds, attributeValueIds }

    for (const base of bases) {
      for (const model of base.models) {
        const modelKey = `${base.data.slug}:${model.data.slug}`;
        const modelId = modelKeyToId.get(modelKey);

        for (const variant of model.variants) {
          allVariantRows.push({
            ...variant.data,
            product_model_id: modelId,
            status: variant.data.status ?? true,
            is_primary: variant.data.is_primary ?? false,
            sort_order: variant.data.sort_order ?? 1,
          });
          variantMeta.push({
            categoryIds: variant.categoryIds,
            attributeValueIds: variant.attributeValueIds,
          });
        }
      }
    }

    Logger.info(`[BulkUpload] Inserting ${allVariantRows.length} product_variant rows`);
    const insertedVariants = [];
    for (const batchRows of chunk(allVariantRows, BATCH_SIZE)) {
      const result = await ProductVariants.bulkCreate(batchRows, {
        transaction: t,
        returning: true,
      });
      insertedVariants.push(...result);
    }

    // ── 4. Insert ProductVariantCategories ───────────────────────────────────
    const categoryJunctionRows = [];
    insertedVariants.forEach((variant, idx) => {
      const { categoryIds } = variantMeta[idx];
      for (const categoryId of categoryIds) {
        categoryJunctionRows.push({
          product_variant_id: variant.id,
          category_id: categoryId,
        });
      }
    });

    if (categoryJunctionRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${categoryJunctionRows.length} variant-category junction rows`);
      for (const batchRows of chunk(categoryJunctionRows, BATCH_SIZE)) {
        await ProductVariantCategories.bulkCreate(batchRows, { transaction: t });
      }
    }

    // ── 5. Insert ProductVariantAttributes ───────────────────────────────────
    const attributeJunctionRows = [];
    insertedVariants.forEach((variant, idx) => {
      const { attributeValueIds } = variantMeta[idx];
      for (const { attribute_id, attribute_value_id } of attributeValueIds) {
        attributeJunctionRows.push({
          product_variant_id: variant.id,
          attribute_id,
          attribute_value_id,
        });
      }
    });

    if (attributeJunctionRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${attributeJunctionRows.length} variant-attribute junction rows`);
      for (const batchRows of chunk(attributeJunctionRows, BATCH_SIZE)) {
        await ProductVariantAttributes.bulkCreate(batchRows, { transaction: t });
      }
    }

    const summary = {
      bases_inserted: insertedBases.length,
      models_inserted: insertedModels.length,
      variants_inserted: insertedVariants.length,
      category_links: categoryJunctionRows.length,
      attribute_links: attributeJunctionRows.length,
    };

    Logger.info(`[BulkUpload] Completed. Summary: ${JSON.stringify(summary)}`);
    return summary;
  });
}

module.exports = { processUpload };

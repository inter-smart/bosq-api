const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../database/models");
const { Op } = require("sequelize");
const Logger = require("../../config/logger");

const {
  ProductBase,
  ProductModels,
  ProductVariants,
  ProductVariantCategories,
  ProductVariantAttributes,
  ProductVariantImages,
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
 * Generate a URL-friendly slug from a title.
 */
function makeSlug(title) {
  return slugify(title.trim(), { lower: true, strict: true });
}

/**
 * Assign unique slugs to a list of bases.
 * Checks existing DB slugs and within-batch collisions.
 */
async function assignBaseSlugs(bases, t) {
  const candidates = bases.map((b) => makeSlug(b.data.title));

  // Batch-check DB for slug conflicts on the exact candidate values
  const uniqueCandidates = [...new Set(candidates)];
  const dbMatches = await ProductBase.findAll({
    attributes: ["slug"],
    where: { slug: { [Op.in]: uniqueCandidates }, deletedAt: null },
    paranoid: false,
    transaction: t,
  });
  const dbSlugSet = new Set(dbMatches.map((r) => r.slug));

  const usedInBatch = new Set();
  return candidates.map((baseSlug) => {
    let finalSlug = baseSlug;
    if (dbSlugSet.has(finalSlug) || usedInBatch.has(finalSlug)) {
      let counter = 1;
      while (dbSlugSet.has(`${baseSlug}-${counter}`) || usedInBatch.has(`${baseSlug}-${counter}`)) {
        counter++;
      }
      finalSlug = `${baseSlug}-${counter}`;
    }
    usedInBatch.add(finalSlug);
    return finalSlug;
  });
}

/**
 * Assign unique slugs to a list of models, scoped per product_id.
 * allModelRows must be [{...data, product_id}].
 * productIds[i] is the DB id for allModelRows[i].
 */
async function assignModelSlugs(allModelRows, t) {
  const candidates = allModelRows.map((r) => makeSlug(r.title));

  // Group candidate slugs by product_id for scoped DB check
  const byProduct = new Map();
  allModelRows.forEach((r, i) => {
    if (!byProduct.has(r.product_id)) byProduct.set(r.product_id, []);
    byProduct.get(r.product_id).push({ idx: i, candidate: candidates[i] });
  });

  const slugs = new Array(allModelRows.length);

  for (const [productId, items] of byProduct.entries()) {
    const candidateSlugsForProduct = [...new Set(items.map((x) => x.candidate))];
    const dbMatches = await ProductModels.findAll({
      attributes: ["slug"],
      where: {
        product_id: productId,
        slug: { [Op.in]: candidateSlugsForProduct },
        deletedAt: null,
      },
      paranoid: false,
      transaction: t,
    });
    const dbSlugSet = new Set(dbMatches.map((r) => r.slug));
    const usedInBatch = new Set();

    for (const { idx, candidate } of items) {
      let finalSlug = candidate;
      if (dbSlugSet.has(finalSlug) || usedInBatch.has(finalSlug)) {
        let counter = 1;
        while (dbSlugSet.has(`${candidate}-${counter}`) || usedInBatch.has(`${candidate}-${counter}`)) {
          counter++;
        }
        finalSlug = `${candidate}-${counter}`;
      }
      usedInBatch.add(finalSlug);
      slugs[idx] = finalSlug;
    }
  }

  return slugs;
}

/**
 * Processes the validated bulk upload hierarchy within a single DB transaction.
 *
 * Insertion order:
 *   1. ProductBase (all)             → build baseTitleToId map
 *   2. ProductModels (all)           → build modelKeyToId map ("baseTitle:modelTitle")
 *   3. ProductVariants (all)         → build variantIndexToId map (with media_path / hover_media_path)
 *   4. ProductVariantCategories      → junction rows
 *   5. ProductVariantAttributes      → junction rows
 *   6. ProductVariantImages          → gallery image / video records
 */
async function processUpload(hierarchy) {
  const { bases } = hierarchy;

  return sequelize.transaction(async (t) => {
    // ── 1. Insert ProductBase ────────────────────────────────────────────────

    // Generate unique slugs from titles before inserting
    const baseSlugs = await assignBaseSlugs(bases, t);

    const baseDataRows = bases.map((b, i) => ({
      ...b.data,
      slug: baseSlugs[i],
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

    // Build title → real DB id map
    const baseTitleToId = new Map();
    insertedBases.forEach((b, idx) => {
      baseTitleToId.set(bases[idx].data.title, b.id);
    });

    // ── 2. Insert ProductModels ──────────────────────────────────────────────

    const allModelRowsRaw = [];
    const modelMeta = []; // track { baseTitle, modelTitle } for map building

    for (const base of bases) {
      const productId = baseTitleToId.get(base.data.title);
      for (const model of base.models) {
        allModelRowsRaw.push({
          ...model.data,
          product_id: productId,
          status: model.data.status ?? true,
          sort_order: model.data.sort_order ?? 1,
        });
        modelMeta.push({ baseTitle: base.data.title, modelTitle: model.data.title });
      }
    }

    // Generate unique slugs for models (scoped per product_id)
    const modelSlugs = await assignModelSlugs(allModelRowsRaw, t);
    const allModelRows = allModelRowsRaw.map((row, i) => ({ ...row, slug: modelSlugs[i] }));

    Logger.info(`[BulkUpload] Inserting ${allModelRows.length} product_model rows`);
    const insertedModels = [];
    for (const batchRows of chunk(allModelRows, BATCH_SIZE)) {
      const result = await ProductModels.bulkCreate(batchRows, {
        transaction: t,
        returning: true,
      });
      insertedModels.push(...result);
    }

    // Build "baseTitle:modelTitle" → real model DB id map
    const modelKeyToId = new Map();
    insertedModels.forEach((m, idx) => {
      const { baseTitle, modelTitle } = modelMeta[idx];
      modelKeyToId.set(`${baseTitle}:${modelTitle}`, m.id);
    });

    // ── 3. Insert ProductVariants ────────────────────────────────────────────

    const allVariantRows = [];
    const variantMeta = []; // track { categoryIds, attributeValueIds, mediaRecords }

    for (const base of bases) {
      for (const model of base.models) {
        const modelKey = `${base.data.title}:${model.data.title}`;
        const modelId = modelKeyToId.get(modelKey);

        for (const variant of model.variants) {
          allVariantRows.push({
            ...variant.data,
            product_model_id: modelId,
            // cover_image and hover_image from the sheet go directly onto the variant record
            ...(variant.coverImage ? { media_path: variant.coverImage } : {}),
            ...(variant.hoverImage ? { hover_media_path: variant.hoverImage } : {}),
            status: variant.data.status ?? true,
            is_primary: variant.data.is_primary ?? false,
            sort_order: variant.data.sort_order ?? 1,
          });
          variantMeta.push({
            categoryIds: variant.categoryIds,
            attributeValueIds: variant.attributeValueIds,
            mediaRecords: variant.mediaRecords || [],
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
      for (const categoryId of variantMeta[idx].categoryIds) {
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
      for (const { attribute_id, attribute_value_id } of variantMeta[idx].attributeValueIds) {
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

    // ── 6. Insert ProductVariantImages ───────────────────────────────────────

    const imageRows = [];
    insertedVariants.forEach((variant, idx) => {
      for (const record of variantMeta[idx].mediaRecords) {
        imageRows.push({
          ...record,
          product_variant_id: variant.id,
        });
      }
    });

    if (imageRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${imageRows.length} product_variant_images rows`);
      for (const batchRows of chunk(imageRows, BATCH_SIZE)) {
        await ProductVariantImages.bulkCreate(batchRows, { transaction: t });
      }
    }

    const summary = {
      bases_inserted: insertedBases.length,
      models_inserted: insertedModels.length,
      variants_inserted: insertedVariants.length,
      category_links: categoryJunctionRows.length,
      attribute_links: attributeJunctionRows.length,
      images_inserted: imageRows.length,
    };

    Logger.info(`[BulkUpload] Completed. Summary: ${JSON.stringify(summary)}`);
    return summary;
  });
}

module.exports = { processUpload };

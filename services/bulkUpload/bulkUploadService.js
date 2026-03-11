const { default: slugify } = require("slugify");
const { models, sequelize } = require("../../database/models");
const { Op } = require("sequelize");
const Logger = require("../../config/logger");

const { ProductBase, ProductModels, ProductVariants, ProductVariantCategories, ProductVariantAttributes, ProductVariantImages, ProductProjectImage, FaqList } = models;

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
 * Assign unique slugs to a list of bases that need to be created.
 * Checks existing DB slugs and within-batch collisions.
 */
async function assignBaseSlugs(bases, t) {
  const candidates = bases.map((b) => makeSlug(b.data.title));

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
 * Assign unique slugs to a list of models that need to be created.
 * Scoped per product_id to avoid cross-product collisions.
 */
async function assignModelSlugs(allModelRows, t) {
  const candidates = allModelRows.map((r) => makeSlug(r.title));

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
 * Uses upsert (update-or-create) for all entities so re-uploads are safe.
 *
 * Identity keys:
 *   ProductBase     — title
 *   ProductModels   — (product_id, title)
 *   ProductVariants — sku (primary), then product_code (fallback)
 *
 * Junction strategies:
 *   Categories / Attributes — full replace for updated variants
 *   Images                  — add-only (skip existing media_paths)
 */
async function processUpload(hierarchy) {
  const { bases } = hierarchy;

  return sequelize.transaction(async (t) => {
    // ── 1. Upsert ProductBase ────────────────────────────────────────────────

    const allBaseTitles = bases.map((b) => b.data.title);

    const existingBases = await ProductBase.findAll({
      attributes: ["id", "title", "slug"],
      where: { title: { [Op.in]: allBaseTitles }, deletedAt: null },
      paranoid: false,
      transaction: t,
    });
    const existingBaseMap = new Map(existingBases.map((b) => [b.title, b]));

    const basesToCreate = [];
    const basesToUpdate = [];

    for (const base of bases) {
      if (existingBaseMap.has(base.data.title)) {
        basesToUpdate.push({ base, existing: existingBaseMap.get(base.data.title) });
      } else {
        basesToCreate.push(base);
      }
    }

    // Generate slugs only for new bases
    const newBaseSlugs = basesToCreate.length > 0 ? await assignBaseSlugs(basesToCreate, t) : [];

    const newBaseDataRows = basesToCreate.map((b, i) => ({
      ...b.data,
      slug: newBaseSlugs[i],
      status: b.data.status ?? true,
      sort_order: b.data.sort_order ?? 1,
    }));

    const baseTitleToId = new Map();

    // Insert new bases
    if (newBaseDataRows.length > 0) {
      Logger.info(`[BulkUpload] Creating ${newBaseDataRows.length} product_base rows`);
      const insertedBases = [];
      for (const batchRows of chunk(newBaseDataRows, BATCH_SIZE)) {
        const result = await ProductBase.bulkCreate(batchRows, { transaction: t, returning: true });
        insertedBases.push(...result);
      }
      insertedBases.forEach((b, idx) => {
        baseTitleToId.set(basesToCreate[idx].data.title, b.id);
      });
    }

    // Update existing bases (no slug change to preserve URLs)
    for (const { base, existing } of basesToUpdate) {
      const updateData = { ...base.data };
      delete updateData.slug; // never overwrite slug on update
      await ProductBase.update(
        { ...updateData, status: base.data.status ?? existing.status, sort_order: base.data.sort_order ?? existing.sort_order },
        { where: { id: existing.id }, transaction: t },
      );
      baseTitleToId.set(base.data.title, existing.id);
    }
    Logger.info(`[BulkUpload] ProductBase — created: ${basesToCreate.length}, updated: ${basesToUpdate.length}`);

    // ── 2. Upsert ProductModels ──────────────────────────────────────────────

    const allModelRowsRaw = [];
    const modelMeta = []; // { baseTitle, modelTitle }

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

    // Batch-fetch existing models by (product_id, title) pairs
    const productIdTitlePairs = allModelRowsRaw.map((r) => ({ product_id: r.product_id, title: r.title }));
    const uniqueProductIds = [...new Set(allModelRowsRaw.map((r) => r.product_id))];
    const uniqueModelTitles = [...new Set(allModelRowsRaw.map((r) => r.title))];

    const existingModels = await ProductModels.findAll({
      attributes: ["id", "product_id", "title", "slug"],
      where: {
        product_id: { [Op.in]: uniqueProductIds },
        title: { [Op.in]: uniqueModelTitles },
        deletedAt: null,
      },
      paranoid: false,
      transaction: t,
    });
    // Narrow key: "productId:title"
    const existingModelMap = new Map(existingModels.map((m) => [`${m.product_id}:${m.title}`, m]));

    const modelsToCreate = [];
    const modelsToCreateMeta = [];
    const modelsToUpdate = [];
    const modelsToUpdateMeta = [];

    allModelRowsRaw.forEach((row, i) => {
      const key = `${row.product_id}:${row.title}`;
      if (existingModelMap.has(key)) {
        modelsToUpdate.push({ row, existing: existingModelMap.get(key) });
        modelsToUpdateMeta.push(modelMeta[i]);
      } else {
        modelsToCreate.push(row);
        modelsToCreateMeta.push(modelMeta[i]);
      }
    });

    const newModelSlugs = modelsToCreate.length > 0 ? await assignModelSlugs(modelsToCreate, t) : [];
    const newModelRows = modelsToCreate.map((row, i) => ({ ...row, slug: newModelSlugs[i] }));

    const modelKeyToId = new Map();

    if (newModelRows.length > 0) {
      Logger.info(`[BulkUpload] Creating ${newModelRows.length} product_model rows`);
      const insertedModels = [];
      for (const batchRows of chunk(newModelRows, BATCH_SIZE)) {
        const result = await ProductModels.bulkCreate(batchRows, { transaction: t, returning: true });
        insertedModels.push(...result);
      }
      insertedModels.forEach((m, idx) => {
        const { baseTitle, modelTitle } = modelsToCreateMeta[idx];
        modelKeyToId.set(`${baseTitle}:${modelTitle}`, m.id);
      });
    }

    for (const { row, existing } of modelsToUpdate) {
      const updateData = { ...row };
      delete updateData.slug;
      await ProductModels.update(updateData, { where: { id: existing.id }, transaction: t });
    }
    modelsToUpdateMeta.forEach(({ baseTitle, modelTitle }, idx) => {
      modelKeyToId.set(`${baseTitle}:${modelTitle}`, modelsToUpdate[idx].existing.id);
    });
    Logger.info(`[BulkUpload] ProductModels — created: ${modelsToCreate.length}, updated: ${modelsToUpdate.length}`);

    // ── 3. Upsert ProductVariants ────────────────────────────────────────────

    const allVariantRows = [];
    const variantMeta = [];

    for (const base of bases) {
      for (const model of base.models) {
        const modelKey = `${base.data.title}:${model.data.title}`;
        const modelId = modelKeyToId.get(modelKey);

        for (const variant of model.variants) {
          allVariantRows.push({
            ...variant.data,
            product_model_id: modelId,
            ...(variant.coverImage ? { media_path: variant.coverImage } : {}),
            ...(variant.hoverImage ? { hover_media_path: variant.hoverImage } : {}),
            ...(variant.brochurePath ? { brochure: variant.brochurePath } : {}),
            status: variant.data.status ?? true,
            is_primary: variant.data.is_primary ?? false,
            is_featured: variant.data.is_featured ?? false,
            sort_order: variant.data.sort_order ?? 1,
          });
          variantMeta.push({
            categoryIds: variant.categoryIds,
            attributeValueIds: variant.attributeValueIds,
            mediaRecords: variant.mediaRecords || [],
            projectImageRecords: variant.projectImageRecords || [],
            faqRecords: variant.faqRecords || [],
          });
        }
      }
    }

    // Batch-fetch existing variants by sku and product_code
    const allSkus = allVariantRows.map((r) => r.sku).filter(Boolean);
    const allProductCodes = allVariantRows.map((r) => r.product_code).filter(Boolean);

    const orConditions = [];
    if (allSkus.length > 0) orConditions.push({ sku: { [Op.in]: allSkus } });
    if (allProductCodes.length > 0) orConditions.push({ product_code: { [Op.in]: allProductCodes } });

    const existingVariantsBySkuMap = new Map();
    const existingVariantsByCodeMap = new Map();

    if (orConditions.length > 0) {
      const existingVariants = await ProductVariants.findAll({
        attributes: ["id", "sku", "product_code"],
        where: { [Op.or]: orConditions, deletedAt: null },
        paranoid: false,
        transaction: t,
      });
      existingVariants.forEach((v) => {
        if (v.sku) existingVariantsBySkuMap.set(v.sku, v);
        if (v.product_code) existingVariantsByCodeMap.set(v.product_code, v);
      });
    }

    const variantsToCreate = [];
    const variantsToCreateMeta = [];
    const variantsToUpdate = []; // { row, existingId }
    const variantsToUpdateMeta = [];
    const updatedVariantIds = new Set();

    allVariantRows.forEach((row, i) => {
      // sku is the primary identity key; product_code is the fallback
      const existing =
        (row.sku && existingVariantsBySkuMap.get(row.sku)) || (row.product_code && existingVariantsByCodeMap.get(row.product_code)) || null;

      if (existing) {
        variantsToUpdate.push({ row, existingId: existing.id });
        variantsToUpdateMeta.push(variantMeta[i]);
        updatedVariantIds.add(existing.id);
      } else {
        variantsToCreate.push(row);
        variantsToCreateMeta.push(variantMeta[i]);
      }
    });

    const insertedVariants = [];

    if (variantsToCreate.length > 0) {
      Logger.info(`[BulkUpload] Creating ${variantsToCreate.length} product_variant rows`);
      for (const batchRows of chunk(variantsToCreate, BATCH_SIZE)) {
        const result = await ProductVariants.bulkCreate(batchRows, { transaction: t, returning: true });
        insertedVariants.push(...result);
      }
    }

    if (variantsToUpdate.length > 0) {
      Logger.info(`[BulkUpload] Updating ${variantsToUpdate.length} product_variant rows`);
      for (const { row, existingId } of variantsToUpdate) {
        await ProductVariants.update(row, { where: { id: existingId }, transaction: t });
      }
    }
    Logger.info(`[BulkUpload] ProductVariants — created: ${variantsToCreate.length}, updated: ${variantsToUpdate.length}`);

    // Build combined variant id → meta index for junction inserts
    // insertedVariants[i] corresponds to variantsToCreateMeta[i]
    // updatedVariantIds entries correspond to variantsToUpdate[i].existingId

    // ── 4. ProductVariantCategories ───────────────────────────────────────────
    // Replace all category rows for updated variants; insert for new variants.

    if (updatedVariantIds.size > 0) {
      await ProductVariantCategories.destroy({
        where: { product_variant_id: { [Op.in]: [...updatedVariantIds] } },
        transaction: t,
      });
    }

    const categoryJunctionRows = [];

    insertedVariants.forEach((variant, idx) => {
      for (const categoryId of variantsToCreateMeta[idx].categoryIds) {
        categoryJunctionRows.push({ product_variant_id: variant.id, category_id: categoryId });
      }
    });
    variantsToUpdate.forEach(({ existingId }, idx) => {
      for (const categoryId of variantsToUpdateMeta[idx].categoryIds) {
        categoryJunctionRows.push({ product_variant_id: existingId, category_id: categoryId });
      }
    });

    if (categoryJunctionRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${categoryJunctionRows.length} variant-category junction rows`);
      for (const batchRows of chunk(categoryJunctionRows, BATCH_SIZE)) {
        await ProductVariantCategories.bulkCreate(batchRows, { transaction: t });
      }
    }

    // ── 5. ProductVariantAttributes ───────────────────────────────────────────
    // Replace all attribute rows for updated variants; insert for new variants.
    // force: true because ProductVariantAttributes is paranoid — soft-delete would
    // leave the unique index occupied and cause constraint errors on re-insert.

    if (updatedVariantIds.size > 0) {
      await ProductVariantAttributes.destroy({
        where: { product_variant_id: { [Op.in]: [...updatedVariantIds] } },
        force: true,
        transaction: t,
      });
    }

    const attributeJunctionRows = [];

    insertedVariants.forEach((variant, idx) => {
      for (const { attribute_id, attribute_value_id } of variantsToCreateMeta[idx].attributeValueIds) {
        attributeJunctionRows.push({ product_variant_id: variant.id, attribute_id, attribute_value_id });
      }
    });
    variantsToUpdate.forEach(({ existingId }, idx) => {
      for (const { attribute_id, attribute_value_id } of variantsToUpdateMeta[idx].attributeValueIds) {
        attributeJunctionRows.push({ product_variant_id: existingId, attribute_id, attribute_value_id });
      }
    });

    if (attributeJunctionRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${attributeJunctionRows.length} variant-attribute junction rows`);
      for (const batchRows of chunk(attributeJunctionRows, BATCH_SIZE)) {
        await ProductVariantAttributes.bulkCreate(batchRows, { transaction: t });
      }
    }

    // ── 6. ProductVariantImages ───────────────────────────────────────────────
    // New variants: insert all media records.
    // Updated variants: add-only — fetch existing media_paths and skip duplicates.

    const imageRows = [];

    // New variants — insert everything
    insertedVariants.forEach((variant, idx) => {
      for (const record of variantsToCreateMeta[idx].mediaRecords) {
        imageRows.push({ ...record, product_variant_id: variant.id });
      }
    });

    // Updated variants — skip media_paths that already exist
    if (variantsToUpdate.length > 0) {
      const updatedIds = variantsToUpdate.map((v) => v.existingId);
      const existingImages = await ProductVariantImages.findAll({
        attributes: ["product_variant_id", "media_path"],
        where: { product_variant_id: { [Op.in]: updatedIds } },
        transaction: t,
      });
      // Set of "variantId:media_path" strings that already exist
      const existingImageSet = new Set(existingImages.map((img) => `${img.product_variant_id}:${img.media_path}`));

      variantsToUpdate.forEach(({ existingId }, idx) => {
        for (const record of variantsToUpdateMeta[idx].mediaRecords) {
          const key = `${existingId}:${record.media_path}`;
          if (!existingImageSet.has(key)) {
            imageRows.push({ ...record, product_variant_id: existingId });
          }
        }
      });
    }

    if (imageRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${imageRows.length} product_variant_images rows`);
      for (const batchRows of chunk(imageRows, BATCH_SIZE)) {
        await ProductVariantImages.bulkCreate(batchRows, { transaction: t });
      }
    }

    // ── Step 7: ProductProjectImage (add-only) ───────────────────────────────
    const projectImageRows = [];

    insertedVariants.forEach((variant, idx) => {
      for (const record of variantsToCreateMeta[idx].projectImageRecords) {
        projectImageRows.push({ ...record, product_variant_id: variant.id });
      }
    });

    if (variantsToUpdate.length > 0) {
      const updatedIds = variantsToUpdate.map(({ existingId }) => existingId);
      const existingProjectImages = await ProductProjectImage.findAll({
        attributes: ["product_variant_id", "media_path"],
        where: { product_variant_id: { [Op.in]: updatedIds } },
        transaction: t,
      });
      const existingProjectImageSet = new Set(existingProjectImages.map((img) => `${img.product_variant_id}:${img.media_path}`));

      variantsToUpdate.forEach(({ existingId }, idx) => {
        for (const record of variantsToUpdateMeta[idx].projectImageRecords) {
          const key = `${existingId}:${record.media_path}`;
          if (!existingProjectImageSet.has(key)) {
            projectImageRows.push({ ...record, product_variant_id: existingId });
          }
        }
      });
    }

    if (projectImageRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${projectImageRows.length} product_project_images rows`);
      for (const batchRows of chunk(projectImageRows, BATCH_SIZE)) {
        await ProductProjectImage.bulkCreate(batchRows, { transaction: t });
      }
    }

    // ── Step 8: FaqList (full replace for updated variants) ──────────────────
    if (updatedVariantIds.size > 0) {
      await FaqList.destroy({
        where: { product_variant_id: { [Op.in]: [...updatedVariantIds] }, type: "product" },
        force: true,
        transaction: t,
      });
    }

    const faqRows = [];

    insertedVariants.forEach((variant, idx) => {
      for (const record of variantsToCreateMeta[idx].faqRecords) {
        faqRows.push({ ...record, product_variant_id: variant.id, type: "product" });
      }
    });

    variantsToUpdate.forEach(({ existingId }, idx) => {
      for (const record of variantsToUpdateMeta[idx].faqRecords) {
        faqRows.push({ ...record, product_variant_id: existingId, type: "product" });
      }
    });

    if (faqRows.length > 0) {
      Logger.info(`[BulkUpload] Inserting ${faqRows.length} faq_lists rows`);
      for (const batchRows of chunk(faqRows, BATCH_SIZE)) {
        await FaqList.bulkCreate(batchRows, { transaction: t });
      }
    }

    const summary = {
      bases_created: basesToCreate.length,
      bases_updated: basesToUpdate.length,
      models_created: modelsToCreate.length,
      models_updated: modelsToUpdate.length,
      variants_created: variantsToCreate.length,
      variants_updated: variantsToUpdate.length,
      category_links: categoryJunctionRows.length,
      attribute_links: attributeJunctionRows.length,
      images_inserted: imageRows.length,
      project_images_inserted: projectImageRows.length,
      faqs_inserted: faqRows.length,
    };

    Logger.info(`[BulkUpload] Completed. Summary: ${JSON.stringify(summary)}`);
    return summary;
  });
}

module.exports = { processUpload };

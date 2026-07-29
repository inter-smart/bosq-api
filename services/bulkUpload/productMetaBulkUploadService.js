const { models, sequelize } = require("../../database/models");
const { Op } = require("sequelize");

const { ProductMeta } = models;

/**
 * Processes a validated product_meta upload within a single DB transaction.
 * Upsert per variant (ProductMeta.product_variant_id is unique): existing
 * rows are updated in place, missing ones are created.
 *
 * @param {Object} hierarchy - { metaRows: [{ variantId, sku, fields }] }
 * @returns {{ created: number, updated: number, total: number }}
 */
async function processProductMetaUpload(hierarchy) {
  const { metaRows } = hierarchy;

  return sequelize.transaction(async (t) => {
    const variantIds = metaRows.map((r) => r.variantId);

    const existing = await ProductMeta.findAll({
      where: { product_variant_id: { [Op.in]: variantIds } },
      transaction: t,
    });
    const existingByVariant = new Map(existing.map((m) => [m.product_variant_id, m]));

    const toUpdate = metaRows.filter((r) => existingByVariant.has(r.variantId));
    const toCreate = metaRows.filter((r) => !existingByVariant.has(r.variantId));

    await Promise.all(toUpdate.map((row) => existingByVariant.get(row.variantId).update(row.fields, { transaction: t })));

    if (toCreate.length > 0) {
      await ProductMeta.bulkCreate(
        toCreate.map((row) => ({ product_variant_id: row.variantId, ...row.fields })),
        { transaction: t },
      );
    }

    return { created: toCreate.length, updated: toUpdate.length, total: metaRows.length };
  });
}

module.exports = { processProductMetaUpload };

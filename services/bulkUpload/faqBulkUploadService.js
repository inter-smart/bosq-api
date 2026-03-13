const { models, sequelize } = require("../../database/models");
const { Op } = require("sequelize");

const { FaqList } = models;

/**
 * Processes a validated FAQ upload hierarchy within a single DB transaction.
 * Full replace per variant: destroys all existing product FAQs for affected
 * variants, then bulk-creates the new set.
 *
 * @param {Object} hierarchy - { faqGroups: [{ variantId, records[] }] }
 * @returns {{ faqs_inserted: number, variants_updated: number }}
 */
async function processFaqUpload(hierarchy) {
  const { faqGroups } = hierarchy;

  return sequelize.transaction(async (t) => {
    const variantIds = faqGroups.map((g) => g.variantId);

    // Full replace: hard-delete all existing product FAQs for these variants
    await FaqList.destroy({
      where: { product_variant_id: { [Op.in]: variantIds }, type: "product" },
      force: true,
      transaction: t,
    });

    // Build flat rows array
    const rows = faqGroups.flatMap(({ variantId, records }) =>
      records.map((r) => ({ ...r, product_variant_id: variantId, type: "product" })),
    );

    if (rows.length > 0) {
      await FaqList.bulkCreate(rows, { transaction: t });
    }

    return { faqs_inserted: rows.length, variants_updated: variantIds.length };
  });
}

module.exports = { processFaqUpload };

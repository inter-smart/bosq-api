const { models } = require("../../database/models");
const { Op } = require("sequelize");

const { ProductVariants } = models;

// ─── Constants ────────────────────────────────────────────────────────────────

const META_REQUIRED = ["sku"];

const META_STRING_MAX = {
  meta_title: 255,
  meta_title_ar: 255,
  meta_description: 255,
  meta_description_ar: 255,
  meta_keywords: 255,
  meta_keywords_ar: 255,
  other_meta: 2000,
  other_meta_ar: 2000,
};

const META_FIELDS = Object.keys(META_STRING_MAX);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addError(errors, row, field, message) {
  errors.push({ sheet: "product_meta", row, field, message });
}

// ─── Validate Product Meta Sheet ───────────────────────────────────────────────

/**
 * Validates a parsed product_meta sheet against the DB.
 *
 * - Required field: sku
 * - String max lengths for meta fields
 * - DB lookup: each SKU must exist as a ProductVariants record
 * - Duplicate SKUs within the sheet are rejected (ambiguous match)
 *
 * Returns { valid: false, errors, summary } on failure.
 * Returns { valid: true, summary, metaRows: [{ variantId, sku, fields }] } on success.
 */
async function validateProductMetaUpload(metaRows) {
  const errors = [];

  if (!Array.isArray(metaRows) || metaRows.length === 0) {
    return {
      valid: false,
      errors: [{ sheet: "product_meta", row: null, field: null, message: "The product_meta sheet is empty or missing." }],
      summary: { total_rows: 0, invalid_rows: 0, valid_rows: 0 },
    };
  }

  // Step 1: Schema validation
  for (const row of metaRows) {
    const rowNum = row._rowNumber;

    for (const field of META_REQUIRED) {
      if (row[field] === null || row[field] === undefined || row[field] === "") {
        addError(errors, rowNum, field, `Required field "${field}" is missing or empty`);
      }
    }

    for (const [field, max] of Object.entries(META_STRING_MAX)) {
      const val = row[field];
      if (val !== null && val !== undefined && String(val).length > max) {
        addError(errors, rowNum, field, `"${field}" exceeds max length of ${max} characters (got: ${String(val).length})`);
      }
    }
  }

  if (errors.length > 0) {
    const errorRows = new Set(errors.map((e) => e.row)).size;
    return {
      valid: false,
      errors,
      summary: { total_rows: metaRows.length, invalid_rows: errorRows, valid_rows: metaRows.length - errorRows },
    };
  }

  // Step 2: Reject duplicate SKUs within the sheet — ambiguous which row should win
  const skuRowNumbers = new Map(); // sku -> first row number seen
  for (const row of metaRows) {
    const sku = String(row.sku).trim();
    if (skuRowNumbers.has(sku)) {
      addError(errors, row._rowNumber, "sku", `Duplicate SKU "${sku}" — also present on row ${skuRowNumbers.get(sku)}`);
    } else {
      skuRowNumbers.set(sku, row._rowNumber);
    }
  }

  if (errors.length > 0) {
    const errorRows = new Set(errors.map((e) => e.row)).size;
    return {
      valid: false,
      errors,
      summary: { total_rows: metaRows.length, invalid_rows: errorRows, valid_rows: metaRows.length - errorRows },
    };
  }

  // Step 3: Collect all unique SKUs and look them up in DB
  const allSkus = [...skuRowNumbers.keys()];

  const existingVariants = await ProductVariants.findAll({
    attributes: ["id", "sku"],
    where: { sku: { [Op.in]: allSkus }, deletedAt: null },
    paranoid: false,
  });

  const skuToVariantId = new Map(existingVariants.map((v) => [v.sku, v.id]));

  for (const row of metaRows) {
    const sku = String(row.sku).trim();
    if (!skuToVariantId.has(sku)) {
      addError(errors, row._rowNumber, "sku", `SKU "${sku}" not found in the database`);
    }
  }

  if (errors.length > 0) {
    const errorRows = new Set(errors.map((e) => e.row)).size;
    return {
      valid: false,
      errors,
      summary: { total_rows: metaRows.length, invalid_rows: errorRows, valid_rows: metaRows.length - errorRows },
    };
  }

  // Step 4: Build the resolved rows ready for upsert
  const resolvedRows = metaRows.map((row) => {
    const sku = String(row.sku).trim();
    const fields = { product_slug: sku };
    META_FIELDS.forEach((field) => {
      fields[field] = row[field] !== null && row[field] !== undefined ? String(row[field]).trim() : null;
    });

    return {
      variantId: skuToVariantId.get(sku),
      sku,
      fields,
    };
  });

  return {
    valid: true,
    summary: { total_rows: metaRows.length, invalid_rows: 0, valid_rows: metaRows.length },
    metaRows: resolvedRows,
  };
}

module.exports = { validateProductMetaUpload };

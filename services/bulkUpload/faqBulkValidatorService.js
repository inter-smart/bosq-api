const { models } = require("../../database/models");
const { Op } = require("sequelize");

const { ProductVariants } = models;

// ─── Constants ────────────────────────────────────────────────────────────────

const FAQ_REQUIRED = ["sku", "question", "answer"];

const BOOLEAN_FIELDS = new Set(["status"]);
const INTEGER_FIELDS = new Set(["sort_order"]);
const FAQ_STRING_MAX = { question: 255, question_ar: 255 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addError(errors, row, field, message) {
  errors.push({ sheet: "product_faqs", row, field, message });
}

function isInteger(val) {
  return Number.isInteger(Number(val)) && !isNaN(Number(val));
}

function isBoolean(val) {
  if (typeof val === "boolean") return true;
  if (typeof val === "string") return ["true", "false", "1", "0", "yes", "no"].includes(val.toLowerCase());
  if (val === 0 || val === 1) return true;
  return false;
}

function parseBoolean(val) {
  if (typeof val === "boolean") return val;
  if (val === 1) return true;
  if (val === 0) return false;
  if (typeof val === "string") return ["true", "1", "yes"].includes(val.toLowerCase());
  return null;
}

function parseInteger(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

// ─── Validate FAQ Sheet ───────────────────────────────────────────────────────

/**
 * Validates a parsed product_faqs sheet against the DB.
 *
 * - Required fields: sku, question, answer
 * - Type checks: sort_order (integer), status (boolean)
 * - DB lookup: each SKU must exist as a ProductVariants record
 *
 * Returns { valid, errors, summary } on failure.
 * Returns { valid: true, summary, hierarchy: { faqGroups } } on success.
 */
async function validateFaqUpload(faqRows) {
  const errors = [];

  if (!Array.isArray(faqRows) || faqRows.length === 0) {
    return {
      valid: false,
      errors: [{ sheet: "product_faqs", row: null, field: null, message: "The product_faqs sheet is empty or missing." }],
      summary: { total_rows: 0, invalid_rows: 0, valid_rows: 0 },
    };
  }

  // Step 1: Schema validation
  for (const row of faqRows) {
    const rowNum = row._rowNumber;

    for (const field of FAQ_REQUIRED) {
      if (row[field] === null || row[field] === undefined || row[field] === "") {
        addError(errors, rowNum, field, `Required field "${field}" is missing or empty`);
      }
    }

    if (row.sort_order !== null && row.sort_order !== undefined && !isInteger(row.sort_order)) {
      addError(errors, rowNum, "sort_order", `"sort_order" must be an integer (got: ${row.sort_order})`);
    }
    if (row.status !== null && row.status !== undefined && !isBoolean(row.status)) {
      addError(errors, rowNum, "status", `"status" must be true/false (got: ${row.status})`);
    }

    // String max lengths
    for (const [field, max] of Object.entries(FAQ_STRING_MAX)) {
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
      summary: { total_rows: faqRows.length, invalid_rows: errorRows, valid_rows: faqRows.length - errorRows },
    };
  }

  // Step 2: Collect all unique SKUs and look them up in DB
  const allSkus = [...new Set(faqRows.map((r) => String(r.sku).trim()).filter(Boolean))];

  const existingVariants = await ProductVariants.findAll({
    attributes: ["id", "sku"],
    where: { sku: { [Op.in]: allSkus }, deletedAt: null },
    paranoid: false,
  });

  const skuToVariantId = new Map(existingVariants.map((v) => [v.sku, v.id]));

  for (const row of faqRows) {
    const sku = String(row.sku).trim();
    if (!skuToVariantId.has(sku)) {
      addError(
        errors,
        row._rowNumber,
        "sku",
        `SKU "${sku}" not found in the database — make sure the product variants are uploaded first`,
      );
    }
  }

  if (errors.length > 0) {
    const errorRows = new Set(errors.map((e) => e.row)).size;
    return {
      valid: false,
      errors,
      summary: { total_rows: faqRows.length, invalid_rows: errorRows, valid_rows: faqRows.length - errorRows },
    };
  }

  // Step 3: Build FAQ groups keyed by variant ID
  const groupMap = new Map(); // variantId → records[]

  for (const row of faqRows) {
    const variantId = skuToVariantId.get(String(row.sku).trim());
    if (!groupMap.has(variantId)) groupMap.set(variantId, []);
    groupMap.get(variantId).push({
      question: row.question ? String(row.question).trim() : null,
      question_ar: row.question_ar ? String(row.question_ar).trim() : null,
      answer: row.answer ? String(row.answer).trim() : null,
      answer_ar: row.answer_ar ? String(row.answer_ar).trim() : null,
      sort_order: row.sort_order !== null && row.sort_order !== undefined ? parseInteger(row.sort_order) : 0,
      status: row.status !== null && row.status !== undefined ? parseBoolean(row.status) : true,
    });
  }

  const faqGroups = Array.from(groupMap.entries()).map(([variantId, records]) => ({ variantId, records }));

  return {
    valid: true,
    summary: { total_faqs: faqRows.length, total_variants: faqGroups.length },
    hierarchy: { faqGroups },
  };
}

module.exports = { validateFaqUpload };

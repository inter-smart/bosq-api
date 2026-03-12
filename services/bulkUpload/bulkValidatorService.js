const fs = require("fs").promises;
const path = require("path");
const { models } = require("../../database/models");
const { Op } = require("sequelize");

const { ProductCategory, ProductAttribute, AttributeValues } = models;

// ─── Constants ────────────────────────────────────────────────────────────────

// Images uploaded via the bulk image upload endpoint land here
const BULK_DIR = path.join(__dirname, "../../uploads/bulk");

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

// ─── Field Definitions ───────────────────────────────────────────────────────

// slug removed — auto-generated from title on insert
// description/details/enhance_title etc. moved to ProductVariants — no longer on ProductBase
const BASE_REQUIRED = ["title", "title_ar"];

// base_slug → base_title; slug removed — auto-generated from title on insert
const MODEL_REQUIRED = ["base_title", "title", "title_ar", "base_price"];

// base_slug → base_title; model_slug → model_title
const VARIANT_REQUIRED = ["base_title", "model_title"];

// FAQ sheet required fields
const FAQ_REQUIRED = ["sku", "question", "answer"];

const DECIMAL_FIELDS = new Set(["base_price", "price"]);
const INTEGER_FIELDS = new Set(["stock", "sort_order"]);
const BOOLEAN_FIELDS = new Set(["status", "is_primary", "is_featured"]);

const SMALLINT_MIN = -32768;
const SMALLINT_MAX = 32767;

// Per-sheet string max lengths matching DB column definitions
const BASE_STRING_MAX = { title: 255, title_ar: 255 };
const MODEL_STRING_MAX = { title: 255, title_ar: 255, code: 100 };
const VARIANT_STRING_MAX = {
  sku: 200, product_code: 200,
  title: 200, title_ar: 200,
  design_title: 200, design_title_ar: 200,
  enhance_title: 255, enhance_title_ar: 255,
  description: 255, description_ar: 255, // STRING(255) in DB — NOT TEXT
};
const FAQ_STRING_MAX = { question: 255, question_ar: 255 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addError(errors, sheet, row, field, message) {
  errors.push({ sheet, row, field, message });
}

function isDecimal(val) {
  return !isNaN(parseFloat(val)) && isFinite(val);
}

function isInteger(val) {
  return Number.isInteger(Number(val)) && !isNaN(Number(val));
}

function isBoolean(val) {
  if (typeof val === "boolean") return true;
  if (typeof val === "string") {
    return ["true", "false", "1", "0", "yes", "no"].includes(val.toLowerCase());
  }
  if (val === 0 || val === 1) return true;
  return false;
}

function parseBoolean(val) {
  if (typeof val === "boolean") return val;
  if (val === 1) return true;
  if (val === 0) return false;
  if (typeof val === "string") {
    return ["true", "1", "yes"].includes(val.toLowerCase());
  }
  return null;
}

function parseDecimal(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseInteger(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

/**
 * Parse the `categories` cell: "sofas,living-room" → ["sofas", "living-room"]
 */
function parseCategorySlugs(cell) {
  if (!cell) return [];
  return String(cell)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse the `attributes` cell: "color:navy-blue|size:large" → [{ attrSlug, valueSlug }]
 */
function parseAttributePairs(cell) {
  if (!cell) return [];
  return String(cell)
    .split("|")
    .map((pair) => {
      const [attrSlug, valueSlug] = pair.split(":").map((s) => s.trim());
      return attrSlug && valueSlug ? { attrSlug, valueSlug } : null;
    })
    .filter(Boolean);
}

/**
 * Parse a comma-separated filename list cell into an array of trimmed filenames.
 * Used for `images` and `video_thumbnails` columns.
 */
function parseCommaList(cell) {
  if (!cell) return [];
  return String(cell)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Step 1: Schema Validation ───────────────────────────────────────────────

function validateSchema(rows, sheetName, requiredFields, errors, stringMaxLengths = {}) {
  for (const row of rows) {
    const rowNum = row._rowNumber;

    for (const field of requiredFields) {
      if (row[field] === null || row[field] === undefined || row[field] === "") {
        addError(errors, sheetName, rowNum, field, `Required field "${field}" is missing or empty`);
      }
    }

    // Type checks for numeric and boolean fields
    for (const [field, val] of Object.entries(row)) {
      if (field.startsWith("_") || val === null || val === undefined) continue;

      if (DECIMAL_FIELDS.has(field) && !isDecimal(val)) {
        addError(errors, sheetName, rowNum, field, `"${field}" must be a decimal number (got: ${val})`);
      }
      if (INTEGER_FIELDS.has(field) && !isInteger(val)) {
        addError(errors, sheetName, rowNum, field, `"${field}" must be an integer (got: ${val})`);
      }
      if (BOOLEAN_FIELDS.has(field) && !isBoolean(val)) {
        addError(errors, sheetName, rowNum, field, `"${field}" must be true/false (got: ${val})`);
      }

      // String length check
      if (stringMaxLengths[field] !== undefined && val !== "") {
        const strVal = String(val);
        if (strVal.length > stringMaxLengths[field]) {
          addError(errors, sheetName, rowNum, field, `"${field}" exceeds max length of ${stringMaxLengths[field]} characters (got: ${strVal.length})`);
        }
      }

      // SMALLINT range check (sort_order is SMALLINT in all tables)
      if (field === "sort_order" && val !== "" && isInteger(val)) {
        const n = parseInt(val, 10);
        if (n < SMALLINT_MIN || n > SMALLINT_MAX) {
          addError(errors, sheetName, rowNum, field, `"sort_order" must be between ${SMALLINT_MIN} and ${SMALLINT_MAX} (got: ${n})`);
        }
      }

      // DECIMAL(10,2) precision and range check
      if (DECIMAL_FIELDS.has(field) && val !== "" && isDecimal(val)) {
        const n = parseFloat(val);
        if (Math.abs(n) > 99999999.99) {
          addError(errors, sheetName, rowNum, field, `"${field}" exceeds DECIMAL(10,2) max value of 99999999.99 (got: ${n})`);
        }
        const str = String(val);
        const dotIdx = str.indexOf(".");
        if (dotIdx !== -1 && str.length - dotIdx - 1 > 2) {
          addError(errors, sheetName, rowNum, field, `"${field}" has more than 2 decimal places and will be rounded by the DB (got: ${val})`);
        }
      }
    }
  }
}

// ─── Step 2: Internal Relational Integrity ───────────────────────────────────

function validateRelations(baseRows, modelRows, variantRows, errors) {
  // Build base title set
  const baseTitleSet = new Set(baseRows.map((r) => r.title).filter(Boolean));

  for (const row of modelRows) {
    if (row.base_title && !baseTitleSet.has(row.base_title)) {
      addError(
        errors,
        "product_models",
        row._rowNumber,
        "base_title",
        `No product_base with title "${row.base_title}" found in the product_base sheet`,
      );
    }
  }

  // Build model lookup: "base_title:model_title"
  const modelLookupSet = new Set(modelRows.filter((r) => r.base_title && r.title).map((r) => `${r.base_title}:${r.title}`));

  for (const row of variantRows) {
    if (row.base_title && row.model_title) {
      const key = `${row.base_title}:${row.model_title}`;
      if (!modelLookupSet.has(key)) {
        addError(
          errors,
          "product_variants",
          row._rowNumber,
          "model_title",
          `No product_model with title "${row.model_title}" under base "${row.base_title}" found in the product_models sheet`,
        );
      }
    }
  }
}

// ─── Step 3: Internal Duplicate Checks ──────────────────────────────────────

function validateInternalDuplicates(baseRows, modelRows, variantRows, errors) {
  // Duplicate base titles
  const baseTitles = new Map();
  for (const row of baseRows) {
    if (!row.title) continue;
    if (baseTitles.has(row.title)) {
      addError(
        errors,
        "product_base",
        row._rowNumber,
        "title",
        `Duplicate title "${row.title}" within product_base sheet (first seen at row ${baseTitles.get(row.title)})`,
      );
    } else {
      baseTitles.set(row.title, row._rowNumber);
    }
  }

  // Duplicate model title per base_title
  const modelKeys = new Map();
  for (const row of modelRows) {
    if (!row.base_title || !row.title) continue;
    const key = `${row.base_title}:${row.title}`;
    if (modelKeys.has(key)) {
      addError(
        errors,
        "product_models",
        row._rowNumber,
        "title",
        `Duplicate model title "${row.title}" under base "${row.base_title}" (first seen at row ${modelKeys.get(key)})`,
      );
    } else {
      modelKeys.set(key, row._rowNumber);
    }
  }

  // Duplicate model code per base_title
  const modelCodes = new Map();
  for (const row of modelRows) {
    if (!row.base_title || !row.code) continue;
    const key = `${row.base_title}:${row.code}`;
    if (modelCodes.has(key)) {
      addError(
        errors,
        "product_models",
        row._rowNumber,
        "code",
        `Duplicate model code "${row.code}" under base "${row.base_title}" (first seen at row ${modelCodes.get(key)})`,
      );
    } else {
      modelCodes.set(key, row._rowNumber);
    }
  }

  // Duplicate variant SKU
  const skus = new Map();
  for (const row of variantRows) {
    if (!row.sku) continue;
    if (skus.has(row.sku)) {
      addError(
        errors,
        "product_variants",
        row._rowNumber,
        "sku",
        `Duplicate SKU "${row.sku}" within product_variants sheet (first seen at row ${skus.get(row.sku)})`,
      );
    } else {
      skus.set(row.sku, row._rowNumber);
    }
  }

  // Duplicate variant product_code
  const productCodes = new Map();
  for (const row of variantRows) {
    if (!row.product_code) continue;
    if (productCodes.has(row.product_code)) {
      addError(
        errors,
        "product_variants",
        row._rowNumber,
        "product_code",
        `Duplicate product_code "${row.product_code}" within product_variants sheet (first seen at row ${productCodes.get(row.product_code)})`,
      );
    } else {
      productCodes.set(row.product_code, row._rowNumber);
    }
  }
}

// ─── Step 4 (removed): DB duplicate checks are no longer performed here.
// The upload service handles existing records via upsert (update-or-create).

// ─── Step 5a: Resolve Model Media Images ─────────────────────────────────────

/**
 * Checks that each product_model's media_path filename exists in BULK_DIR.
 * Returns a Map: rowNumber → "uploads/bulk/<filename>" for valid rows.
 */
async function resolveModelImages(modelRows, errors) {
  const allModelImageFiles = new Set();
  for (const row of modelRows) {
    if (row.media_path) allModelImageFiles.add(String(row.media_path).trim());
  }

  const missingFiles = new Set();
  for (const filename of allModelImageFiles) {
    const fullPath = path.join(BULK_DIR, filename);
    const exists = await fs
      .access(fullPath)
      .then(() => true)
      .catch(() => false);
    if (!exists) missingFiles.add(filename);
  }

  const resolvedPaths = new Map(); // rowNumber → resolved path string
  for (const row of modelRows) {
    if (!row.media_path) continue;
    const filename = String(row.media_path).trim();
    if (missingFiles.has(filename)) {
      addError(errors, "product_models", row._rowNumber, "media_path", `Image file "${filename}" not found in the bulk upload directory`);
    } else {
      resolvedPaths.set(row._rowNumber, `uploads/bulk/${filename}`);
    }
  }
  return resolvedPaths;
}

// ─── Step 5b: Resolve Categories, Attributes & Validate Variant Images ────────

async function resolveAndValidateLookups(variantRows, errors) {
  const categorySlugToId = new Map();
  const attributeSlugToId = new Map();
  const attributeValueMap = new Map(); // "attrId:valueSlug" → valueId

  // Collect all unique slugs and image filenames
  const allCategorySlugs = new Set();
  const allAttributeSlugs = new Set();
  const allImageFiles = new Set();

  for (const row of variantRows) {
    parseCategorySlugs(row.categories).forEach((s) => allCategorySlugs.add(s));
    parseAttributePairs(row.attributes).forEach(({ attrSlug }) => allAttributeSlugs.add(attrSlug));

    if (row.cover_image) allImageFiles.add(String(row.cover_image).trim());
    if (row.hover_image) allImageFiles.add(String(row.hover_image).trim());
    if (row.brochure) allImageFiles.add(String(row.brochure).trim());
    parseCommaList(row.images).forEach((f) => allImageFiles.add(f));
    parseCommaList(row.video_thumbnails).forEach((f) => allImageFiles.add(f));
    parseCommaList(row.project_images).forEach((f) => allImageFiles.add(f));
  }

  // Fetch categories
  if (allCategorySlugs.size > 0) {
    const cats = await ProductCategory.findAll({
      attributes: ["id", "slug"],
      where: { slug: { [Op.in]: [...allCategorySlugs] }, deletedAt: null },
      paranoid: false,
    });
    cats.forEach((c) => categorySlugToId.set(c.slug, c.id));
  }

  // Fetch attributes and their values
  if (allAttributeSlugs.size > 0) {
    const attrs = await ProductAttribute.findAll({
      attributes: ["id", "slug"],
      where: { slug: { [Op.in]: [...allAttributeSlugs] }, deletedAt: null },
      paranoid: false,
    });
    attrs.forEach((a) => attributeSlugToId.set(a.slug, a.id));

    const foundAttrIds = attrs.map((a) => a.id);
    if (foundAttrIds.length > 0) {
      const values = await AttributeValues.findAll({
        attributes: ["id", "attribute_id", "slug"],
        where: { attribute_id: { [Op.in]: foundAttrIds }, deletedAt: null },
        paranoid: false,
      });
      values.forEach((v) => attributeValueMap.set(`${v.attribute_id}:${v.slug}`, v.id));
    }
  }

  // Batch-check image file existence in BULK_DIR
  const missingFiles = new Set();
  for (const filename of allImageFiles) {
    const fullPath = path.join(BULK_DIR, filename);
    const exists = await fs
      .access(fullPath)
      .then(() => true)
      .catch(() => false);
    if (!exists) missingFiles.add(filename);
  }

  // Validate per-row and build resolved data
  const resolvedVariants = variantRows.map((row) => {
    const categorySlugs = parseCategorySlugs(row.categories);
    const attributePairs = parseAttributePairs(row.attributes);
    const categoryIds = [];
    const attributeValueIds = [];

    for (const slug of categorySlugs) {
      if (!categorySlugToId.has(slug)) {
        addError(errors, "product_variants", row._rowNumber, "categories", `Category slug "${slug}" not found in the database`);
      } else {
        categoryIds.push(categorySlugToId.get(slug));
      }
    }

    for (const { attrSlug, valueSlug } of attributePairs) {
      const attrId = attributeSlugToId.get(attrSlug);
      if (!attrId) {
        addError(errors, "product_variants", row._rowNumber, "attributes", `Attribute slug "${attrSlug}" not found in the database`);
        continue;
      }
      const valueKey = `${attrId}:${valueSlug}`;
      const valueId = attributeValueMap.get(valueKey);
      if (!valueId) {
        addError(
          errors,
          "product_variants",
          row._rowNumber,
          "attributes",
          `Attribute value slug "${valueSlug}" not found for attribute "${attrSlug}"`,
        );
        continue;
      }
      attributeValueIds.push({ attribute_id: attrId, attribute_value_id: valueId });
    }

    // ── Image validation & resolution ─────────────────────────────────────────
    //
    // Sheet columns:
    //   cover_image       — single filename → ProductVariants.media_path
    //   hover_image       — single filename → ProductVariants.hover_media_path
    //   images            — comma-separated filenames (images + videos in display order)
    //                       → ProductVariantImages records
    //   video_thumbnails  — comma-separated thumbnails, one per video in "images" order
    //                       → thumbnail_path on the matching video record

    const checkFile = (filename, field) => {
      if (missingFiles.has(filename)) {
        addError(errors, "product_variants", row._rowNumber, field, `Image file "${filename}" not found in the bulk upload directory`);
        return false;
      }
      return true;
    };

    let coverImage = null;
    let hoverImage = null;
    let brochurePath = null;
    const mediaRecords = [];
    const projectImageRecords = [];

    const coverFilename = row.cover_image ? String(row.cover_image).trim() : null;
    const hoverFilename = row.hover_image ? String(row.hover_image).trim() : null;
    const brochureFilename = row.brochure ? String(row.brochure).trim() : null;

    if (coverFilename && checkFile(coverFilename, "cover_image")) {
      coverImage = `uploads/bulk/${coverFilename}`;
    }

    if (hoverFilename && checkFile(hoverFilename, "hover_image")) {
      hoverImage = `uploads/bulk/${hoverFilename}`;
    }

    if (brochureFilename && checkFile(brochureFilename, "brochure")) {
      brochurePath = `uploads/bulk/${brochureFilename}`;
    }

    const imageFiles = parseCommaList(row.images);
    const thumbnailFiles = parseCommaList(row.video_thumbnails);
    const projectFiles = parseCommaList(row.project_images);

    // Validate thumbnail count does not exceed video count
    const videoCount = imageFiles.filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase())).length;
    if (thumbnailFiles.length > videoCount) {
      addError(
        errors,
        "product_variants",
        row._rowNumber,
        "video_thumbnails",
        `More video thumbnails (${thumbnailFiles.length}) than videos (${videoCount}) in the "images" column`,
      );
    }

    let thumbIdx = 0;
    imageFiles.forEach((filename, sortIdx) => {
      const ext = path.extname(filename).toLowerCase();
      const isVideo = VIDEO_EXTS.has(ext);
      const fileValid = checkFile(filename, "images");

      let thumbnailPath = null;
      if (isVideo) {
        const thumbFilename = thumbnailFiles[thumbIdx] || null;
        if (thumbFilename && checkFile(thumbFilename, "video_thumbnails")) {
          thumbnailPath = `uploads/bulk/${thumbFilename}`;
        }
        thumbIdx++;
      }

      if (fileValid) {
        mediaRecords.push({
          media_path: `uploads/bulk/${filename}`,
          media_type: isVideo ? "video" : "image",
          sort_order: sortIdx + 1,
          status: true,
          is_primary: false,
          thumbnail_path: thumbnailPath,
        });
      }
    });

    // Project images — simple image records linked to the variant
    projectFiles.forEach((filename, sortIdx) => {
      if (checkFile(filename, "project_images")) {
        projectImageRecords.push({
          media_path: `uploads/bulk/${filename}`,
          sort_order: sortIdx + 1,
          status: true,
        });
      }
    });

    return { row, categoryIds, attributeValueIds, coverImage, hoverImage, brochurePath, mediaRecords, projectImageRecords };
  });

  return resolvedVariants;
}

// ─── Step 6: FAQ Validation ──────────────────────────────────────────────────

/**
 * Validates product_faqs sheet rows.
 * Each FAQ must reference a sku that exists in the product_variants sheet.
 * Returns a Map<sku, faqRecord[]> for use in buildHierarchy.
 */
function validateFaqs(faqRows, variantRows, errors) {
  const variantSkuSet = new Set(variantRows.map((r) => r.sku).filter(Boolean).map((s) => String(s).trim()));

  const faqsByVariantSku = new Map();

  for (const row of faqRows) {
    const rowNum = row._rowNumber;

    // Required fields
    for (const field of FAQ_REQUIRED) {
      if (row[field] === null || row[field] === undefined || row[field] === "") {
        addError(errors, "product_faqs", rowNum, field, `Required field "${field}" is missing or empty`);
      }
    }

    if (!row.sku) continue; // already reported above

    const sku = String(row.sku).trim();

    if (!variantSkuSet.has(sku)) {
      addError(
        errors,
        "product_faqs",
        rowNum,
        "sku",
        `SKU "${sku}" not found in the product_variants sheet — each FAQ must reference a valid variant SKU`,
      );
      continue;
    }

    // Type validation
    if (row.sort_order !== null && row.sort_order !== undefined && !isInteger(row.sort_order)) {
      addError(errors, "product_faqs", rowNum, "sort_order", `"sort_order" must be an integer (got: ${row.sort_order})`);
    }
    if (row.status !== null && row.status !== undefined && !isBoolean(row.status)) {
      addError(errors, "product_faqs", rowNum, "status", `"status" must be true/false (got: ${row.status})`);
    }

    const faqRecord = {
      question: row.question ? String(row.question).trim() : null,
      question_ar: row.question_ar ? String(row.question_ar).trim() : null,
      answer: row.answer ? String(row.answer).trim() : null,
      answer_ar: row.answer_ar ? String(row.answer_ar).trim() : null,
      sort_order: row.sort_order !== null && row.sort_order !== undefined ? parseInteger(row.sort_order) : 0,
      status: row.status !== null && row.status !== undefined ? parseBoolean(row.status) : true,
    };

    if (!faqsByVariantSku.has(sku)) faqsByVariantSku.set(sku, []);
    faqsByVariantSku.get(sku).push(faqRecord);
  }

  return faqsByVariantSku;
}

// ─── Build Hierarchy ────────────────────────────────────────────────────────

function buildHierarchy(baseRows, modelRows, resolvedVariants, modelImagePaths, faqsByVariantSku = new Map()) {
  // Index models by "base_title"
  const modelsByBase = new Map();
  for (const row of modelRows) {
    if (!modelsByBase.has(row.base_title)) modelsByBase.set(row.base_title, []);
    modelsByBase.get(row.base_title).push(row);
  }

  // Index variants by "base_title:model_title", attaching FAQ records by sku
  const variantsByModel = new Map();
  for (const resolved of resolvedVariants) {
    const { row } = resolved;
    const key = `${row.base_title}:${row.model_title}`;
    if (!variantsByModel.has(key)) variantsByModel.set(key, []);
    resolved.faqRecords = row.sku ? (faqsByVariantSku.get(String(row.sku).trim()) || []) : [];
    variantsByModel.get(key).push(resolved);
  }

  const cleanRow = (row, fields) => {
    const obj = {};
    for (const f of fields) {
      let val = row[f] ?? null;
      if (DECIMAL_FIELDS.has(f) && val !== null) val = parseDecimal(val);
      if (INTEGER_FIELDS.has(f) && val !== null) val = parseInteger(val);
      if (BOOLEAN_FIELDS.has(f) && val !== null) val = parseBoolean(val);
      obj[f] = val;
    }
    return obj;
  };

  // slug removed from both sheets — the upload service generates slugs from titles
  // description/details/enhance_title fields now live on ProductVariants, not ProductBase
  const BASE_FIELDS = ["title", "title_ar", "sort_order", "status"];
  const MODEL_FIELDS = ["title", "title_ar", "code", "base_price", "sort_order", "status"];
  const VARIANT_FIELDS = [
    "sku",
    "product_code",
    "title",
    "title_ar",
    "design_title",
    "design_title_ar",
    "price",
    "stock",
    "is_primary",
    "is_featured",
    "sort_order",
    "status",
    "enhance_title",
    "enhance_title_ar",
    "description",
    "description_ar",
    "details",
    "details_ar",
    "details_points",
    "details_points_ar",
    "additional_details",
    "additional_details_ar",
    // brochure filename is resolved to a full path in resolveAndValidateLookups;
    // the raw cell value is intentionally excluded — brochurePath is used instead
  ];

  const bases = baseRows.map((baseRow) => {
    const baseModelRows = modelsByBase.get(baseRow.title) || [];
    const modelsList = baseModelRows.map((modelRow) => {
      const key = `${modelRow.base_title}:${modelRow.title}`;
      const variantList = (variantsByModel.get(key) || []).map(({ row, categoryIds, attributeValueIds, coverImage, hoverImage, brochurePath, mediaRecords, projectImageRecords, faqRecords }) => ({
        rowNum: row._rowNumber,
        data: cleanRow(row, VARIANT_FIELDS),
        categoryIds,
        attributeValueIds,
        coverImage,
        hoverImage,
        brochurePath,
        mediaRecords,
        projectImageRecords,
        faqRecords: faqRecords || [],
      }));

      const resolvedMediaPath = modelImagePaths ? modelImagePaths.get(modelRow._rowNumber) : null;
      return {
        rowNum: modelRow._rowNumber,
        data: {
          ...cleanRow(modelRow, MODEL_FIELDS),
          ...(resolvedMediaPath ? { media_path: resolvedMediaPath } : {}),
        },
        variants: variantList,
      };
    });

    return {
      rowNum: baseRow._rowNumber,
      data: cleanRow(baseRow, BASE_FIELDS),
      models: modelsList,
    };
  });

  return { bases };
}

// ─── Main Validate Function ──────────────────────────────────────────────────

async function validateBulkUpload(parsedSheets) {
  const { product_base: baseRows, product_models: modelRows, product_variants: variantRows, product_faqs: faqRows = [] } = parsedSheets;
  const errors = [];

  // Step 1: Schema validation (required fields + type checks + DB length/range checks)
  validateSchema(baseRows,    "product_base",     BASE_REQUIRED,    errors, BASE_STRING_MAX);
  validateSchema(modelRows,   "product_models",   MODEL_REQUIRED,   errors, MODEL_STRING_MAX);
  validateSchema(variantRows, "product_variants", VARIANT_REQUIRED, errors, VARIANT_STRING_MAX);
  validateSchema(faqRows,     "product_faqs",     FAQ_REQUIRED,     errors, FAQ_STRING_MAX);

  // Step 2: Internal relational integrity
  validateRelations(baseRows, modelRows, variantRows, errors);

  // Step 3: Internal duplicates
  validateInternalDuplicates(baseRows, modelRows, variantRows, errors);

  // Step 5: FAQ sheet validation (runs sync before async lookups)
  const faqsByVariantSku = validateFaqs(faqRows, variantRows, errors);

  // Note: DB duplicate checks removed — service layer handles upsert (update-or-create)
  // Resolve model images and variant lookups in parallel
  const [modelImagePaths, resolvedVariants] = await Promise.all([
    resolveModelImages(modelRows, errors),
    resolveAndValidateLookups(variantRows, errors),
  ]);

  if (errors.length > 0) {
    const totalRows = baseRows.length + modelRows.length + variantRows.length + faqRows.length;
    const errorRows = new Set(errors.map((e) => `${e.sheet}:${e.row}`)).size;
    return {
      valid: false,
      errors,
      summary: {
        total_rows: totalRows,
        invalid_rows: errorRows,
        valid_rows: totalRows - errorRows,
      },
    };
  }

  // Build hierarchy for storage
  const hierarchy = buildHierarchy(baseRows, modelRows, resolvedVariants, modelImagePaths, faqsByVariantSku);
  const summary = {
    total_bases: baseRows.length,
    total_models: modelRows.length,
    total_variants: variantRows.length,
    total_faqs: faqRows.length,
  };

  return { valid: true, hierarchy, summary };
}

module.exports = { validateBulkUpload };

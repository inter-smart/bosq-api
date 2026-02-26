const { models } = require("../../database/models");
const { Op } = require("sequelize");

const {
  ProductBase,
  ProductModels,
  ProductVariants,
  ProductCategory,
  ProductAttribute,
  AttributeValues,
} = models;

// ─── Field Definitions ──────────────────────────────────────────────────────

const BASE_REQUIRED = ["slug", "title", "title_ar", "description", "description_ar"];
const MODEL_REQUIRED = ["base_slug", "slug", "title", "title_ar"];
const VARIANT_REQUIRED = ["base_slug", "model_slug"];

const DECIMAL_FIELDS = new Set(["base_price", "price"]);
const INTEGER_FIELDS = new Set(["stock", "sort_order"]);
const BOOLEAN_FIELDS = new Set(["status", "is_primary"]);

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

// ─── Step 1: Schema Validation ───────────────────────────────────────────────

function validateSchema(rows, sheetName, requiredFields, errors) {
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
    }
  }
}

// ─── Step 2: Internal Relational Integrity ───────────────────────────────────

function validateRelations(baseRows, modelRows, variantRows, errors) {
  // Build base slug set
  const baseSlugSet = new Set(baseRows.map((r) => r.slug).filter(Boolean));

  for (const row of modelRows) {
    if (row.base_slug && !baseSlugSet.has(row.base_slug)) {
      addError(
        errors,
        "product_models",
        row._rowNumber,
        "base_slug",
        `No product_base with slug "${row.base_slug}" found in the product_base sheet`
      );
    }
  }

  // Build model lookup: "base_slug:model_slug"
  const modelLookupSet = new Set(
    modelRows
      .filter((r) => r.base_slug && r.slug)
      .map((r) => `${r.base_slug}:${r.slug}`)
  );

  for (const row of variantRows) {
    if (row.base_slug && row.model_slug) {
      const key = `${row.base_slug}:${row.model_slug}`;
      if (!modelLookupSet.has(key)) {
        addError(
          errors,
          "product_variants",
          row._rowNumber,
          "model_slug",
          `No product_model with slug "${row.model_slug}" under base "${row.base_slug}" found in the product_models sheet`
        );
      }
    }
  }
}

// ─── Step 3: Internal Duplicate Checks ──────────────────────────────────────

function validateInternalDuplicates(baseRows, modelRows, variantRows, errors) {
  // Duplicate base slugs
  const baseSlugs = new Map();
  for (const row of baseRows) {
    if (!row.slug) continue;
    if (baseSlugs.has(row.slug)) {
      addError(
        errors,
        "product_base",
        row._rowNumber,
        "slug",
        `Duplicate slug "${row.slug}" within product_base sheet (first seen at row ${baseSlugs.get(row.slug)})`
      );
    } else {
      baseSlugs.set(row.slug, row._rowNumber);
    }
  }

  // Duplicate model slug per base
  const modelKeys = new Map();
  for (const row of modelRows) {
    if (!row.base_slug || !row.slug) continue;
    const key = `${row.base_slug}:${row.slug}`;
    if (modelKeys.has(key)) {
      addError(
        errors,
        "product_models",
        row._rowNumber,
        "slug",
        `Duplicate model slug "${row.slug}" under base "${row.base_slug}" (first seen at row ${modelKeys.get(key)})`
      );
    } else {
      modelKeys.set(key, row._rowNumber);
    }
  }

  // Duplicate model code per base
  const modelCodes = new Map();
  for (const row of modelRows) {
    if (!row.base_slug || !row.code) continue;
    const key = `${row.base_slug}:${row.code}`;
    if (modelCodes.has(key)) {
      addError(
        errors,
        "product_models",
        row._rowNumber,
        "code",
        `Duplicate model code "${row.code}" under base "${row.base_slug}" (first seen at row ${modelCodes.get(key)})`
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
        `Duplicate SKU "${row.sku}" within product_variants sheet (first seen at row ${skus.get(row.sku)})`
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
        `Duplicate product_code "${row.product_code}" within product_variants sheet (first seen at row ${productCodes.get(row.product_code)})`
      );
    } else {
      productCodes.set(row.product_code, row._rowNumber);
    }
  }
}

// ─── Step 4: DB Duplicate Checks ────────────────────────────────────────────

async function validateDbDuplicates(baseRows, modelRows, variantRows, errors) {
  // ── ProductBase slugs ──
  const baseSlugsInExcel = baseRows.map((r) => r.slug).filter(Boolean);
  if (baseSlugsInExcel.length > 0) {
    const existingBases = await ProductBase.findAll({
      attributes: ["slug"],
      where: { slug: { [Op.in]: baseSlugsInExcel }, deletedAt: null },
      paranoid: false,
    });
    const existingBaseSlugs = new Set(existingBases.map((r) => r.slug));
    for (const row of baseRows) {
      if (row.slug && existingBaseSlugs.has(row.slug)) {
        addError(
          errors,
          "product_base",
          row._rowNumber,
          "slug",
          `Slug "${row.slug}" already exists in the database`
        );
      }
    }
  }

  // ── ProductModel codes & slugs (global check — title uniqueness enforced at insert) ──
  const modelSlugsInExcel = modelRows.map((r) => r.slug).filter(Boolean);
  const modelCodesInExcel = modelRows.map((r) => r.code).filter(Boolean);

  // Note: model slug uniqueness is per-product so we can't easily pre-check without
  // knowing the new product IDs. We skip slug DB check for models (new products) but
  // check codes globally since codes should ideally be globally unique.
  if (modelCodesInExcel.length > 0) {
    const existingModelCodes = await ProductModels.findAll({
      attributes: ["code"],
      where: { code: { [Op.in]: modelCodesInExcel }, deletedAt: null },
      paranoid: false,
    });
    const existingCodes = new Set(existingModelCodes.map((r) => r.code));
    for (const row of modelRows) {
      if (row.code && existingCodes.has(row.code)) {
        addError(
          errors,
          "product_models",
          row._rowNumber,
          "code",
          `Model code "${row.code}" already exists in the database`
        );
      }
    }
  }

  // ── ProductVariant SKUs and product_codes ──
  const skusInExcel = variantRows.map((r) => r.sku).filter(Boolean);
  const productCodesInExcel = variantRows.map((r) => r.product_code).filter(Boolean);

  if (skusInExcel.length > 0) {
    const existingSkus = await ProductVariants.findAll({
      attributes: ["sku"],
      where: { sku: { [Op.in]: skusInExcel }, deletedAt: null },
      paranoid: false,
    });
    const existingSkuSet = new Set(existingSkus.map((r) => r.sku));
    for (const row of variantRows) {
      if (row.sku && existingSkuSet.has(row.sku)) {
        addError(
          errors,
          "product_variants",
          row._rowNumber,
          "sku",
          `SKU "${row.sku}" already exists in the database`
        );
      }
    }
  }

  if (productCodesInExcel.length > 0) {
    const existingCodes = await ProductVariants.findAll({
      attributes: ["product_code"],
      where: { product_code: { [Op.in]: productCodesInExcel }, deletedAt: null },
      paranoid: false,
    });
    const existingCodeSet = new Set(existingCodes.map((r) => r.product_code));
    for (const row of variantRows) {
      if (row.product_code && existingCodeSet.has(row.product_code)) {
        addError(
          errors,
          "product_variants",
          row._rowNumber,
          "product_code",
          `Product code "${row.product_code}" already exists in the database`
        );
      }
    }
  }
}

// ─── Step 5: Resolve Categories & Attributes ────────────────────────────────

async function resolveAndValidateLookups(variantRows, errors) {
  const categorySlugToId = new Map();
  const attributeSlugToId = new Map();
  const attributeValueMap = new Map(); // "attrId:valueSlug" → valueId

  // Collect all unique category slugs
  const allCategorySlugs = new Set();
  const allAttributeSlugs = new Set();

  for (const row of variantRows) {
    parseCategorySlugs(row.categories).forEach((s) => allCategorySlugs.add(s));
    parseAttributePairs(row.attributes).forEach(({ attrSlug }) => allAttributeSlugs.add(attrSlug));
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

  // Fetch attributes
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

  // Validate per-row and build resolved data
  const resolvedVariants = variantRows.map((row) => {
    const categorySlugs = parseCategorySlugs(row.categories);
    const attributePairs = parseAttributePairs(row.attributes);
    const categoryIds = [];
    const attributeValueIds = [];

    for (const slug of categorySlugs) {
      if (!categorySlugToId.has(slug)) {
        addError(
          errors,
          "product_variants",
          row._rowNumber,
          "categories",
          `Category slug "${slug}" not found in the database`
        );
      } else {
        categoryIds.push(categorySlugToId.get(slug));
      }
    }

    for (const { attrSlug, valueSlug } of attributePairs) {
      const attrId = attributeSlugToId.get(attrSlug);
      if (!attrId) {
        addError(
          errors,
          "product_variants",
          row._rowNumber,
          "attributes",
          `Attribute slug "${attrSlug}" not found in the database`
        );
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
          `Attribute value slug "${valueSlug}" not found for attribute "${attrSlug}"`
        );
        continue;
      }
      attributeValueIds.push({ attribute_id: attrId, attribute_value_id: valueId });
    }

    return { row, categoryIds, attributeValueIds };
  });

  return resolvedVariants;
}

// ─── Build Hierarchy ────────────────────────────────────────────────────────

function buildHierarchy(baseRows, modelRows, resolvedVariants) {
  // Index models by "base_slug"
  const modelsByBase = new Map();
  for (const row of modelRows) {
    if (!modelsByBase.has(row.base_slug)) modelsByBase.set(row.base_slug, []);
    modelsByBase.get(row.base_slug).push(row);
  }

  // Index variants by "base_slug:model_slug"
  const variantsByModel = new Map();
  for (const { row, categoryIds, attributeValueIds } of resolvedVariants) {
    const key = `${row.base_slug}:${row.model_slug}`;
    if (!variantsByModel.has(key)) variantsByModel.set(key, []);
    variantsByModel.get(key).push({ row, categoryIds, attributeValueIds });
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

  const BASE_FIELDS = [
    "slug", "title", "title_ar", "description", "description_ar",
    "enhance_title", "enhance_title_ar", "details", "details_ar",
    "details_points", "details_points_ar", "additional_details", "additional_details_ar",
    "sort_order", "status",
  ];
  const MODEL_FIELDS = [
    "slug", "title", "title_ar", "code", "base_price", "sort_order", "status",
  ];
  const VARIANT_FIELDS = [
    "sku", "product_code", "title", "title_ar", "design_title", "design_title_ar",
    "price", "stock", "is_primary", "sort_order", "status",
  ];

  const bases = baseRows.map((baseRow) => {
    const models = (modelsByBase.get(baseRow.slug) || []).map((modelRow) => {
      const key = `${modelRow.base_slug}:${modelRow.slug}`;
      const variants = (variantsByModel.get(key) || []).map(({ row, categoryIds, attributeValueIds }) => ({
        rowNum: row._rowNumber,
        data: cleanRow(row, VARIANT_FIELDS),
        categoryIds,
        attributeValueIds,
      }));

      return {
        rowNum: modelRow._rowNumber,
        data: cleanRow(modelRow, MODEL_FIELDS),
        variants,
      };
    });

    return {
      rowNum: baseRow._rowNumber,
      data: cleanRow(baseRow, BASE_FIELDS),
      models,
    };
  });

  return { bases };
}

// ─── Main Validate Function ──────────────────────────────────────────────────

async function validateBulkUpload(parsedSheets) {
  const { product_base: baseRows, product_models: modelRows, product_variants: variantRows } = parsedSheets;
  const errors = [];

  // Step 1: Schema validation
  validateSchema(baseRows, "product_base", BASE_REQUIRED, errors);
  validateSchema(modelRows, "product_models", MODEL_REQUIRED, errors);
  validateSchema(variantRows, "product_variants", VARIANT_REQUIRED, errors);

  // Step 2: Internal relational integrity
  validateRelations(baseRows, modelRows, variantRows, errors);

  // Step 3: Internal duplicates
  validateInternalDuplicates(baseRows, modelRows, variantRows, errors);

  // Step 4: DB duplicate checks
  await validateDbDuplicates(baseRows, modelRows, variantRows, errors);

  // Step 5: Resolve & validate lookups (categories + attributes)
  const resolvedVariants = await resolveAndValidateLookups(variantRows, errors);

  if (errors.length > 0) {
    const totalRows = baseRows.length + modelRows.length + variantRows.length;
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
  const hierarchy = buildHierarchy(baseRows, modelRows, resolvedVariants);
  const summary = {
    total_bases: baseRows.length,
    total_models: modelRows.length,
    total_variants: variantRows.length,
  };

  return { valid: true, hierarchy, summary };
}

module.exports = { validateBulkUpload };

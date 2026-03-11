const ExcelJS = require("exceljs");

const REQUIRED_SHEETS = ["product_base", "product_models", "product_variants"];
const OPTIONAL_SHEETS = ["product_faqs"];

/**
 * Converts an ExcelJS row to a plain object using the header row as keys.
 * Returns null if the row is completely empty.
 */
function rowToObject(headers, row, rowNumber) {
  const obj = { _rowNumber: rowNumber };
  let hasValue = false;

  headers.forEach((header, idx) => {
    if (!header) return;
    const cell = row.getCell(idx + 1);
    let value = cell.value;

    // Unwrap rich text objects
    if (value && typeof value === "object" && value.richText) {
      value = value.richText.map((r) => r.text).join("");
    }
    // Unwrap formula results
    if (value && typeof value === "object" && value.result !== undefined) {
      value = value.result;
    }
    // Trim strings
    if (typeof value === "string") {
      value = value.trim();
      if (value === "") value = null;
    }

    obj[header] = value ?? null;
    if (value !== null && value !== undefined) hasValue = true;
  });

  return hasValue ? obj : null;
}

/**
 * Parse a single worksheet into an array of row objects.
 */
function parseSheet(sheet, sheetName) {
  const headerRow = sheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const val = cell.value ? String(cell.value).trim().toLowerCase().replace(/\s+/g, "_") : null;
    headers[colNumber - 1] = val;
  });

  if (headers.length === 0 || headers.every((h) => !h)) {
    throw new Error(`Sheet "${sheetName}" has no header row`);
  }

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const obj = rowToObject(headers, row, rowNumber);
    if (obj) rows.push(obj);
  });

  return rows;
}

/**
 * Parses an Excel buffer and returns raw rows for each sheet.
 *
 * Returns:
 * {
 *   product_base: [{ _rowNumber, title, title_ar, ... }],
 *   product_models: [{ _rowNumber, base_title, title, ... }],
 *   product_variants: [{ _rowNumber, base_title, model_title, cover_image, hover_image, images, video_thumbnails, ... }],
 *   product_faqs: [{ _rowNumber, sku, question, answer, ... }]  // empty array if sheet absent
 * }
 */
async function parseExcelBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const result = {};

  for (const sheetName of REQUIRED_SHEETS) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      throw new Error(`Missing required sheet: "${sheetName}"`);
    }
    result[sheetName] = parseSheet(sheet, sheetName);
  }

  for (const sheetName of OPTIONAL_SHEETS) {
    const sheet = workbook.getWorksheet(sheetName);
    result[sheetName] = sheet ? parseSheet(sheet, sheetName) : [];
  }

  return result;
}

module.exports = { parseExcelBuffer };

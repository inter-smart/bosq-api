const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- PRODUCT ID ---------- */
  body("product_id").optional({ nullable: true }).isInt().withMessage("Product ID must be an integer"),

  /* ---------- SKU ---------- */
  body("sku").optional({ nullable: true }).isString().withMessage("SKU must be a string"),

  /* ---------- PRICE ---------- */
  // body("price").optional({ nullable: true }).isNumeric().withMessage("Price must be a number"),

  /* ---------- STOCK ---------- */
  body("stock").optional({ nullable: true }).isInt().withMessage("Stock must be an integer"),

  /* ---------- DESIGN TITLE ---------- */
  // body("design_title").notEmpty().withMessage("Design title is required").isString().withMessage("Design title must be a string"),

  /* ---------- DESIGN TITLE (ARABIC) ---------- */
  // body("design_title_ar").notEmpty().withMessage("Design title (Arabic) is required").isString().withMessage("Design title (Arabic) must be a string"),

  /* ---------- HOVER MEDIA PATH ---------- */
  // body("hover_media_path").optional({ nullable: true }).isString().withMessage("Hover media path must be a string"),

  /* ---------- PRODUCT CODE ---------- */
  body("product_code").optional({ nullable: true }).isString().withMessage("Product code must be a string"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional({ nullable: true }).isInt().withMessage("Sort order must be an integer"),

  /* ---------- STATUS ---------- */
  body("status").optional({ nullable: true }).isBoolean().withMessage("Status must be true or false"),

  /* ---------- CATEGORY IDS ---------- */
  body("category_ids")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (typeof value === "string") {
        try { return JSON.parse(value); } catch { return value; }
      }
      return value;
    })
    .isArray()
    .withMessage("category_ids must be an array"),
  body("category_ids.*")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Each category ID must be a positive integer"),
];
exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

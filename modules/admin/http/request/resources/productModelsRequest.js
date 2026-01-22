const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- product_id ---------- */
  body("product_id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),

  /* ---------- title ---------- */
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 255 })
    .withMessage("Title must be at most 255 characters"),

  /* ---------- title_ar ---------- */
  body("title_ar")
    .notEmpty()
    .withMessage("Title (Arabic) is required")
    .isString()
    .withMessage("Title (Arabic) must be a string")
    .isLength({ max: 255 })
    .withMessage("Title (Arabic) must be at most 255 characters"),

  /* ---------- media_path ---------- */
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  /* ---------- base_price ---------- */
  body("base_price")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Base price must be a valid decimal with up to 2 decimal places"),

  /* ---------- status ---------- */
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),

  /* ---------- sort_order ---------- */
  body("sort_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

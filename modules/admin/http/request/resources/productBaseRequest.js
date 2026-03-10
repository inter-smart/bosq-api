const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- TITLE ---------- */
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),
  body("title_ar")
    .notEmpty()
    .withMessage("Title (Arabic) is required")
    .isString()
    .withMessage("Title (Arabic) must be a string"),

  body("enhance_title")
    .optional()
    .isString()
    .withMessage("enhance Title must be a string"),
  body("enhance_title_ar")
    .optional()
    .isString()
    .withMessage("enhance Title (Arabic) must be a string"),

  /* ---------- SLUG (AUTO-GENERATED) ---------- */
  body("slug").optional().isString().withMessage("Slug must be a string"),

  /* ---------- MEDIA PATH ---------- */
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  /* ---------- STATUS ---------- */
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

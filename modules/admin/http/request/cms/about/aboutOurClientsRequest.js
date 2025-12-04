const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- MEDIA (OPTIONAL) ---------- */
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  /* ---------- TITLES ---------- */
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),

  body("title_ar")
    .notEmpty()
    .withMessage("Arabic title is required")
    .isString()
    .withMessage("Arabic title must be a string"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order")
    .notEmpty()
    .withMessage("Sort order is required")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  /* ---------- STATUS ---------- */
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isBoolean()
    .withMessage("Status must be true or false"),
];

/* ---------- ID VALIDATION ---------- */
exports.validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer"),
];

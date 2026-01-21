const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- ATTRIBUTE ID ---------- */
  body("attribute_id").notEmpty().withMessage("Attribute ID is required").isInt({ min: 1 }).withMessage("Attribute ID must be a positive integer"),

  /* ---------- VALUE ---------- */
  body("value").notEmpty().withMessage("Value is required").isString().withMessage("Value must be a string"),
  body("value_ar").optional().isString().withMessage("Arabic value must be a string"),

  /* ---------- MEDIA PATH ---------- */
  body("media_path").optional().isString().withMessage("Media path must be a string"),

  /* ---------- SLUG (AUTO-GENERATED) ---------- */
  body("slug").optional().isString().withMessage("Slug must be a string"),

  /* ---------- STATUS ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

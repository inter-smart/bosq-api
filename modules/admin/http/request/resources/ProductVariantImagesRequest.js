const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- PRODUCT VARIANT ID ---------- */
  body("product_variant_id").notEmpty().withMessage("Product variant ID is required"),
];

exports.validationRequestUpdate = [
  /* ---------- OPTIONAL FIELDS FOR UPDATE ---------- */
  body("media_type").optional().isString().withMessage("Media type must be a string"),
  body("sort_order").optional(),
  body("status").optional(),
  body("is_primary").optional(),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- NAME ---------- */
  body("name").notEmpty().withMessage("Name is required").isString().withMessage("Name must be a string"),
  body("name_ar").notEmpty().withMessage("Arabic name is required").isString().withMessage("Arabic name must be a string"),
  
  /* ---------- CODE ---------- */
  body("code").optional(),

  /* ---------- SLUG (AUTO-GENERATED) ---------- */
  body("slug").optional().isString().withMessage("Slug must be a string"),

  /* ---------- STATUS ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

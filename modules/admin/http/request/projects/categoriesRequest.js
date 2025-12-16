const { body, param } = require("express-validator");

exports.validationProjectCategories = [
  /* ---------- NAME ---------- */
  body("name").optional().isString().withMessage("Name must be a string"),

  body("name_ar").optional().isString().withMessage("Arabic name must be a string"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),

  /* ---------- STATUS ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

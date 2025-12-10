const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- TITLES ---------- */
  body("title").optional().isString().withMessage("Title must be a string"),

  body("title_ar").optional().isString().withMessage("Title Arabic must be a string"),

  /* ---------- DESCRIPTION ---------- */
  body("description").optional().isString().withMessage("Description must be a string"),

  body("description_ar").optional().isString().withMessage("Description Arabic must be a string"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),

  /* ---------- STATUS ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

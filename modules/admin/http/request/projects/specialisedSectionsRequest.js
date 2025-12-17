const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- Project ID ---------- */
  body("project_id").optional().isInt({ min: 1 }).withMessage("Project ID must be a positive integer"),

  /* ---------- Media ---------- */
  body("media_path").optional().isString().withMessage("Media path must be a string"),
  body("media_alt").optional().isString().withMessage("Media alt must be a string"),
  body("media_alt_ar").optional().isString().withMessage("Media alt in Arabic must be a string"),

  /* ---------- Titles ---------- */
  body("title").optional().isString().withMessage("Title must be a string"),
  body("title_ar").optional().isString().withMessage("Title in Arabic must be a string"),

  /* ---------- Sort Order ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),

  /* ---------- Status ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

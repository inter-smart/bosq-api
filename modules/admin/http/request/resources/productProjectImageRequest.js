const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- media_path ---------- */
  body("media_path").notEmpty().withMessage("Media path is required").isString().withMessage("Media path must be a string"),
  
  /* ---------- media_alt ---------- */
  body("media_alt").optional().isString().withMessage("Media alt must be a string"),
  body("media_alt_ar").optional().isString().withMessage("Media alt (Arabic) must be a string"),

  /* ---------- STATUS ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

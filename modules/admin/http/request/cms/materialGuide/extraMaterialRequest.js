const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // TITLE
  body("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),

  body("title_ar").notEmpty().withMessage("Title (Arabic) is required").isString().withMessage("Title (Arabic) must be a string"),

  // DESCRIPTION
  body("description").notEmpty().withMessage("Description is required").isString().withMessage("Description must be a string"),

  body("description_ar").notEmpty().withMessage("Description (Arabic) is required").isString().withMessage("Description (Arabic) must be a string"),

  // MEDIA PATH (OPTIONAL)
  body("media_path").optional().isString().withMessage("Media path must be a string"),

  // MEDIA ALT FIELDS
  body("media_alt").optional().isString().withMessage("Media alt must be a string"),

  body("media_alt_ar").optional().isString().withMessage("Media alt (Arabic) must be a string"),

  // SORT ORDER
  body("sort_order").optional().isInt({ min: 0 }).withMessage("Sort order must be a positive integer"),

  // STATUS
  body("status").optional().isBoolean().withMessage("Status must be true or false"),
];

// Validate URL ID
exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

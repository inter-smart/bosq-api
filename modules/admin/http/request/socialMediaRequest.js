const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // ICON (SVG / image path / HTML allowed)
  body("icon_media_path")
    .optional()
    .isString()
    .withMessage("Icon must be a valid string"),

  // ICON ALT
  body("icon_alt")
    .isString()
    .withMessage("Icon alt text must be a string")
    .isLength({ max: 255 })
    .withMessage("Icon alt text must not exceed 255 characters"),

  // ICON ALT AR
  body("icon_alt_ar")
    .isString()
    .withMessage("Icon alt Arabic text must be a string")
    .isLength({ max: 255 })
    .withMessage("Icon alt Arabic text must not exceed 255 characters"),

  // LINK
  body("link")
    .isString()
    .withMessage("Link must be a string")
    .isURL({ require_protocol: true })
    .withMessage("Link must be a valid URL with protocol"),

  // SORT ORDER
  body("sort_order")
    .isInt({ min: 0 })
    .withMessage("Sort order must be a positive integer"),

  // STATUS
  body("status").isBoolean().withMessage("Status must be true or false"),
];

// Validate Social Media ID
exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

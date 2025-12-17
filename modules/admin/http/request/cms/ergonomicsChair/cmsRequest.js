const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // TITLE (EN)
  body("title")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters"),

  // TITLE (AR)
  body("title_ar")
    .isString()
    .withMessage("Arabic title must be a string")
    .isLength({ max: 255 })
    .withMessage("Arabic title must not exceed 255 characters"),

  // BANNER DESKTOP IMAGE PATH
  body("banner_media_desktop_path")
    .optional()
    .isString()
    .withMessage("Desktop banner path must be a string"),

  // BANNER MOBILE IMAGE PATH
  body("banner_media_mobile_path")
    .optional()
    .isString()
    .withMessage("Mobile banner path must be a string"),

  // BANNER ALT (EN)
  body("banner_media_alt")
    .optional()
    .isString()
    .withMessage("Banner alt text must be a string")
    .isLength({ max: 255 })
    .withMessage("Banner alt text must not exceed 255 characters"),

  // BANNER ALT (AR)
  body("banner_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Banner alt Arabic text must be a string")
    .isLength({ max: 255 })
    .withMessage("Banner alt Arabic text must not exceed 255 characters"),
];

// Validate ID (for update / delete / get-by-id)
exports.validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer"),
];

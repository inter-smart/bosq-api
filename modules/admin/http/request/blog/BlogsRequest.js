const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // Title
  body("title")
    .notEmpty()
    .withMessage("Title is required"),

  body("title_ar")
    .notEmpty()
    .withMessage("Arabic title is required"),

  // Description (rich text allowed)
  body("description")
    .notEmpty()
    .withMessage("Description is required"),

  body("description_ar")
    .notEmpty()
    .withMessage("Arabic description is required"),

  // Slug
  body("slug")
    .optional()
    .isString()
    .withMessage("Slug must be a valid string")
    .isLength({ max: 255 })
    .withMessage("Slug must not exceed 255 characters"),

  // Media desktop + mobile
  body("media_desktop_path")
    .optional()
    .isString()
    .withMessage("Desktop media path must be a string"),

  body("media_mobile_path")
    .optional()
    .isString()
    .withMessage("Mobile media path must be a string"),

  // Media ALT
  body("media_alt")
    .notEmpty()
    .withMessage("Media alt text is required"),

  body("media_alt_ar")
    .notEmpty()
    .withMessage("Arabic media alt text is required"),

  // Thumbnail
  body("thumbnail")
    .optional()
    .isString()
    .withMessage("Thumbnail must be a string"),

  body("thumbnail_alt")
    .optional()
    .isString()
    .withMessage("Thumbnail alt must be a string"),

  body("thumbnail_alt_ar")
    .optional()
    .isString()
    .withMessage("Arabic thumbnail alt must be a string"),

  // Published date
  body("published_date")
    .notEmpty()
    .withMessage("Published date is required")
    .isISO8601()
    .withMessage("Published date must be a valid date"),

  // Sort order
  body("sort_order")
    .optional()
    .isInt()
    .withMessage("Sort order must be an integer"),

  // Status
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),
];

// Validate blog ID
exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

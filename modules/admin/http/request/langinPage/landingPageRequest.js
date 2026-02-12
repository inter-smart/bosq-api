const { body, param } = require("express-validator");

/* ---------- CREATE VALIDATION ---------- */
exports.validationRequestPost = [
  // Required fields
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isString().withMessage("Title must be a string"),

  body("title_ar")
    .trim()
    .notEmpty().withMessage("Arabic title is required")
    .isString().withMessage("Arabic title must be a string"),

  // Optional text fields
  body("description")
    .optional()
    .isString().withMessage("Description must be a string"),

  body("description_ar")
    .optional()
    .isString().withMessage("Arabic description must be a string"),

  body("media_desktop_path")
    .optional()
    .isString().withMessage("Desktop media path must be a string"),

  body("media_mobile_path")
    .optional()
    .isString().withMessage("Mobile media path must be a string"),

  body("media_alt")
    .optional()
    .isString().withMessage("Media alt must be a string")
    .isLength({ max: 255 }).withMessage("Media alt cannot exceed 255 characters"),

  body("media_alt_ar")
    .optional()
    .isString().withMessage("Arabic media alt must be a string")
    .isLength({ max: 255 }).withMessage("Arabic media alt cannot exceed 255 characters"),

  body("button_label")
    .optional()
    .isString().withMessage("Button label must be a string"),

  body("button_label_ar")
    .optional()
    .isString().withMessage("Arabic button label must be a string"),

  body("link")
    .optional()
    // .isURL().withMessage("Link must be a valid URL"),
    .isString().withMessage("Link must be a string"),

  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug must contain only lowercase letters, numbers and hyphens"),

  body("sort_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),

  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),

  // SEO fields
  body("meta_title").optional().isString(),
  body("meta_description").optional().isString(),
  body("meta_keywords").optional().isString(),
  body("meta_title_ar").optional().isString(),
  body("meta_description_ar").optional().isString(),
  body("meta_keywords_ar").optional().isString(),
  body("other_meta").optional().isString(),
  body("other_meta_ar").optional().isString(),
];


// Validate blog ID
exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

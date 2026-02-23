const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // Title
  body("title").notEmpty().withMessage("Title is required"),

  body("title_ar").notEmpty().withMessage("Arabic title is required"),

  body("name").notEmpty().withMessage("Name is required"),
  body("name_ar").notEmpty().withMessage("Name is required"),

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

  // Description (rich text allowed)
  body("description").notEmpty().withMessage("Description is required"),

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
    .optional()
    .isString()
    .withMessage("Media alt text is required"),

  body("media_alt_ar")
    .optional()
    .isString()
    .withMessage("Arabic media alt text is required"),

  // Published date
  body("published_date")
    .notEmpty()
    .withMessage("Published date is required")
    .isISO8601()
    .withMessage("Published date must be a valid date"),


  // Status
  body("status").isBoolean().withMessage("Status must be true or false"),

  // meta
  body("meta_title").isString().withMessage("Meta title must be a string"),
  body("meta_title_ar")
    .isString()
    .withMessage("Meta title Arabic must be a string"),
  body("meta_description")
    .isString()
    .withMessage("Meta description must be a string"),
  body("meta_description_ar")
    .isString()
    .withMessage("Meta description Arabic must be a string"),
  body("meta_keywords")
    .isString()
    .withMessage("Meta keywords must be a string"),
  body("meta_keywords_ar")
    .isString()
    .withMessage("Meta keywords Arabic must be a string"),
];

// Validate news ID
exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

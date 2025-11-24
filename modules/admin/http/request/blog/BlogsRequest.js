const { body, param } = require("express-validator");

exports.validationRequestPost = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),

  body("banner_media_desktop_path")
    .optional()
    .isString()
    .withMessage("Banner desktop media path must be a string"),

  body("banner_media_mobile_path")
    .optional()
    .isString()
    .withMessage("Banner mobile media path must be a string"),

  body("banner_media_alt")
    .optional()
    .isString()
    .withMessage("Banner media alt must be a string"),
  // Slug
  body("slug")
    .optional()
    .isString()
    .withMessage("Slug must be a valid string")
    .isLength({ max: 255 })
    .withMessage("Slug must not exceed 255 characters"),

  // Thumbnail
  body("thumbnail")
    .optional()
    .isString()
    .withMessage("Thumbnail must be a string"),

  body("thumbnail_alt")
    .optional()
    .isString()
    .withMessage("Thumbnail alt must be a string")
    .isLength({ max: 255 })
    .withMessage("Thumbnail alt must not exceed 255 characters"),

  body("published_date")
    .notEmpty()
    .withMessage("Published date is required")
    .isISO8601()
    .withMessage("Published date must be a valid date"),

  body("sort_order")
    .optional()
    .isInt()
    .withMessage("Sort order must be an integer"),

  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

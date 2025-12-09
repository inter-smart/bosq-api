const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // Title
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),

  body("title_ar")
    .notEmpty()
    .withMessage("Title (Arabic) is required")
    .isString()
    .withMessage("Title (Arabic) must be a string"),

  // Duration
  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isString()
    .withMessage("Duration must be a string"),

  body("duration_ar")
    .notEmpty()
    .withMessage("Duration (Arabic) is required")
    .isString()
    .withMessage("Duration (Arabic) must be a string"),

  // Optional icon path
  body("icon_media_path")
    .optional({ nullable: true })
    .isString()
    .withMessage("Icon path must be a string"),

  // Optional status boolean
  body("status")
    .isBoolean()
    .withMessage("Status must be true or false"),

  // Optional sort order
  body("sort_order")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),
];

// ID validation
exports.validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer"),
];

const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // MEDIA
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  body("media_alt").isString().withMessage("Media alt must be a string"),

  body("media_alt_ar")
    .isString()
    .withMessage("Media alt Arabic must be a string"),

  // TITLES
  body("title").isString().withMessage("Title must be a string"),

  body("title_ar").isString().withMessage("Title Arabic must be a string"),

  // DESCRIPTIONS
  body("description").isString().withMessage("Description must be a string"),

  body("description_ar")
    .isString()
    .withMessage("Description Arabic must be a string"),

  // LINK
  body("link").isString().withMessage("Link must be a string"),

  // BUTTON TEXT
  body("button_text").isString().withMessage("Button text must be a string"),

  body("button_text_ar")
    .isString()
    .withMessage("Button text Arabic must be a string"),

  // SORT ORDER
  body("sort_order")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  // STATUS
  body("status").isBoolean().withMessage("Status must be true or false"),
];

// Validate ID param
exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

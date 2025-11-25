const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // MEDIA PATHS
  body("media_desktop_path")
    .optional()
    .isString()
    .withMessage("Desktop media path must be a string"),

  body("media_mobile_path")
    .optional()
    .isString()
    .withMessage("Mobile media path must be a string"),

  body("media_alt")
    .optional()
    .isString()
    .withMessage("Media alt must be a string"),

  // TITLES
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string"),

  body("title_ar")
    .optional()
    .isString()
    .withMessage("Title Arabic must be a string"),

  // DESCRIPTIONS
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("description_ar")
    .optional()
    .isString()
    .withMessage("Description Arabic must be a string"),

  // LINK
  body("link")
    .optional()
    .isString()
    .withMessage("Link must be a string"),

  // BUTTON TEXT
  body("button_text")
    .optional()
    .isString()
    .withMessage("Button text must be a string"),

  body("button_text_ar")
    .optional()
    .isString()
    .withMessage("Button text Arabic must be a string"),

  // SORT ORDER
  body("sort_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  // STATUS
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];
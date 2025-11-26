const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // MEDIA
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  // TITLES
  body("title")
    .isString()
    .withMessage("Title must be a string"),

  body("title_ar")
    .isString()
    .withMessage("Title Arabic must be a string"),

  // SORT ORDER
  body("sort_order")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  // STATUS
  body("status")
    .isBoolean()
    .withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

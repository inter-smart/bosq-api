const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // TITLE
  body("title")
    .notEmpty()
    .withMessage("Category title is required")
    .isString()
    .withMessage("Category title must be a string"),

  body("title_ar")
    .notEmpty()
    .withMessage("Category title in Arabic is required")
    .isString()
    .withMessage("Category title in Arabic must be a string"),

  // SORT ORDER
  body("sort_order")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  // STATUS
  body("status").isBoolean().withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

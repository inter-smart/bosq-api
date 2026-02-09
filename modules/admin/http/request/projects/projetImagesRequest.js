const { body, param } = require("express-validator");

exports.validateRequestPost = [
  body("media_path")
    .optional()
    .isString()
    .withMessage("media path must be a string"),

  body("media_alt")
    .optional()
    .isString()
    .withMessage("media alt must be a string"),

  body("media_alt_ar")
    .optional()
    .isString()
    .withMessage("media alt in Arabic must be a string"),

  // status sort order
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),
  body("sort_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

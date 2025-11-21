const { body,param } = require("express-validator");

exports.validationRequestPost = [
  // BANNER MEDIA
  body("media_desktop_path")
    .optional()
    .isString()
    .withMessage("Banner media path must be a string"),

  body("media_mobile_path")
    .optional()
    .isString()
    .withMessage("Banner media path must be a string"),

  body("media_alt")
    .optional()
    .isString()
    .withMessage("Banner media alt must be a string"),

  // BANNER MAIN FIELDS
  body("title").isString().withMessage("Banner title must be a string"),

  body("description")
    .isString()
    .withMessage("Banner description must be a string"),

  body("link").isString().withMessage("Banner link must be a string"),

  body("button_text")
    .isString()
    .withMessage("Banner button text must be a string"),

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

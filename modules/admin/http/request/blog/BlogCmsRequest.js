const { body } = require("express-validator");

exports.validationRequestPost = [
  body("title")
    .optional()
    .isString()
    .withMessage("Banner Title must be a string"),


  body("description")
    .notEmpty()
    .withMessage("Banner description is required"),

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
];

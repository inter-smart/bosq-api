const { body } = require("express-validator");

exports.validationRequestPost = [
  body("title")
    .notEmpty()
    .withMessage("Title is required"),

  body("form_title")
    .notEmpty()
    .withMessage("Form title is required"),

  body("form_description")
    .notEmpty()
    .withMessage("Form description is required"),

    body("media_path")
    .optional()
    .isString()
    .withMessage("media path must be a string"),

  body("media_alt")
    .notEmpty()
    .withMessage("Media alt text is required"),
];

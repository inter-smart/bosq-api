const { body } = require("express-validator");

exports.validationRequestPost = [
  // TITLE
  body("title")
    .notEmpty()
    .withMessage("Title is required"),
  body("title_ar")
    .notEmpty()
    .withMessage("Arabic title is required"),

  // FORM TITLE
  body("form_title")
    .notEmpty()
    .withMessage("Form title is required"),
  body("form_title_ar")
    .notEmpty()
    .withMessage("Arabic form title is required"),

  // FORM DESCRIPTION
  body("form_description")
    .notEmpty()
    .withMessage("Form description is required"),
  body("form_description_ar")
    .notEmpty()
    .withMessage("Arabic form description is required"),

  // MEDIA PATH (OPTIONAL)
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  // MEDIA ALT
  body("media_alt")
    .notEmpty()
    .withMessage("Media alt text is required"),
  body("media_alt_ar")
    .notEmpty()
    .withMessage("Arabic media alt text is required"),

  // MEDIA TITLE
  body("media_title")
    .notEmpty()
    .withMessage("Media title is required"),
  body("media_title_ar")
    .notEmpty()
    .withMessage("Arabic media title is required"),

  // MEDIA DESCRIPTION
  body("media_description")
    .notEmpty()
    .withMessage("Media description is required"),
  body("media_description_ar")
    .notEmpty()
    .withMessage("Arabic media description is required"),
];

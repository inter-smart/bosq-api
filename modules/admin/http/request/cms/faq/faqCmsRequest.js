const { body } = require("express-validator");

exports.validationRequestPost = [
  // Banner Title (English & Arabic)
  body("banner_title")
    .notEmpty()
    .withMessage("Banner title is required")
    .isString()
    .withMessage("Banner title must be a string"),

  body("banner_title_ar")
    .notEmpty()
    .withMessage("Banner title in Arabic is required")
    .isString()
    .withMessage("Banner title in Arabic must be a string"),

  // Banner Media
  body("banner_media_desktop_path")
    .optional()
    .isString()
    .withMessage("Banner media desktop path must be a string"),

  body("banner_media_mobile_path")
    .optional()
    .isString()
    .withMessage("Banner media mobile path must be a string"),

  body("banner_media_alt")
    .optional()
    .isString()
    .withMessage("Banner media alt must be a string"),

  body("banner_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Banner media alt in Arabic must be a string"),

  // buttons
  body("banner_button_text")
    .notEmpty()
    .withMessage("Banner button text is required")
    .isString()
    .withMessage("Banner button text must be a string"),

  body("banner_button_text_ar")
    .notEmpty()
    .withMessage("Banner button text in Arabic is required")
    .isString()
    .withMessage("Banner button text in Arabic must be a string"),

  body("banner_button_link")
    .notEmpty()
    .withMessage("Banner button link is required")
    .isString()
    .withMessage("Banner button link must be a string"),

  // Question Title (English & Arabic)
  body("question_title")
    .notEmpty()
    .withMessage("Question title is required")
    .isString()
    .withMessage("Question title must be a string"),

  body("question_title_ar")
    .notEmpty()
    .withMessage("Question title in Arabic is required")
    .isString()
    .withMessage("Question title in Arabic must be a string"),

  // Question Description (English & Arabic)
  body("question_description")
    .notEmpty()
    .withMessage("Question description is required")
    .isString()
    .withMessage("Question description must be a string"),

  body("question_description_ar")
    .notEmpty()
    .withMessage("Question description in Arabic is required")
    .isString()
    .withMessage("Question description in Arabic must be a string"),
];

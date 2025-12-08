const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // Banner Title
  body("banner_title")
    .notEmpty()
    .withMessage("Banner title is required")
    .isString()
    .withMessage("Banner title must be a string"),

  body("banner_title_ar")
    .notEmpty()
    .withMessage("Banner title (Arabic) is required")
    .isString()
    .withMessage("Banner title (Arabic) must be a string"),

  // Optional banner media
  body("banner_media_mobile_path")
    .optional({ nullable: true })
    .isString()
    .withMessage("Mobile banner media path must be a string"),

  body("banner_media_desktop_path")
    .optional({ nullable: true })
    .isString()
    .withMessage("Desktop banner media path must be a string"),

  body("banner_media_alt")
    .optional({ nullable: true })
    .isString()
    .withMessage("Banner alt text must be a string"),

  body("banner_media_alt_ar")
    .optional({ nullable: true })
    .isString()
    .withMessage("Banner alt text (Arabic) must be a string"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

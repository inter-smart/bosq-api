const { body } = require("express-validator");

exports.validationRequestPost = [
  body("title")
    .optional()
    .isString()
    .withMessage("Banner Title must be a string"),


  body("description")
    .notEmpty()
    .withMessage("Banner description is required"),

  body("banner_media_desktop_path")
    .optional()
    .isString()
    .withMessage("Banner desktop media path must be a string"),

  body("banner_media_mobile_path")
    .optional()
    .isString()
    .withMessage("Banner mobile media path must be a string"),

  body("banner_media_alt")
    .optional()
    .isString()
    .withMessage("Banner media alt must be a string"),
];

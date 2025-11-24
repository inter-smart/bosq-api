const { body } = require("express-validator");

exports.validationRequestPost = [
  body("banner_title")
    .notEmpty()
    .withMessage("Banner title is required"),

  body("banner_description")
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

  body("journey_title")
    .notEmpty()
    .withMessage("Journey title is required"),

  body("journey_description")
    .notEmpty()
    .withMessage("Journey description is required"),

  body("why_choose_us_title")
    .notEmpty()
    .withMessage("Why choose us title is required"),

  body("why_choose_us_description")
    .notEmpty()
    .withMessage("Why choose us description is required"),

  body("testimonial_title")
    .notEmpty()
    .withMessage("Testimonial title is required"),

  body("client_title")
    .notEmpty()
    .withMessage("Client title is required"),

  body("news_title")
    .notEmpty()
    .withMessage("News title is required"),
];

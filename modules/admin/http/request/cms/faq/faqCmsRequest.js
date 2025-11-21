const { body } = require("express-validator");

exports.validationRequestPost = [

  // BANNER
  body("banner_title")
    .isString()
    .withMessage("Banner title must be a string"),

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

  // TITLES
  body("general_title")
    .isString()
    .withMessage("General title must be a string"),

  body("payment_title")
    .isString()
    .withMessage("Payment title must be a string"),

  body("refund_title")
    .isString()
    .withMessage("Refund title must be a string"),

  body("product_title")
    .isString()
    .withMessage("Product title must be a string"),

  body("warrenty_title")
    .isString()
    .withMessage("Warrenty title must be a string"),

  body("question_title")
    .isString()
    .withMessage("Question title must be a string"),

  body("question_description")
    .isString()
    .withMessage("Question description must be a string"),
];

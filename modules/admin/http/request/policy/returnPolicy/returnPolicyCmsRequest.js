const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // OPTIONAL MEDIA FIELDS
  body("media_path")
    .optional({ nullable: true })
    .isString()
    .withMessage("Media path must be a string"),

  body("media_alt")
    .optional({ nullable: true })
    .isString()
    .withMessage("Media alt text must be a string"),

  body("media_alt_ar")
    .optional({ nullable: true })
    .isString()
    .withMessage("Media alt text (Arabic) must be a string"),

];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];
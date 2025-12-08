const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // TITLE
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),

  body("title_ar")
    .notEmpty()
    .withMessage("Title in Arabic is required")
    .isString()
    .withMessage("Title in Arabic must be a string"),

  // DESCRIPTION
  body("desription")
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),

  body("desription_ar")
    .notEmpty()
    .withMessage("Description in Arabic is required")
    .isString()
    .withMessage("Description in Arabic must be a string"),

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

  // SORT ORDER
  body("sort_order")
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),

  // STATUS
  body("status")
    .isBoolean()
    .withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];
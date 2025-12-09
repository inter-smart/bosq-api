const { body } = require("express-validator");

exports.validationRequestPost = [
  // TITLE
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters"),

  // TITLE AR
  body("title_ar")
    .notEmpty()
    .withMessage("Arabic title is required")
    .isString()
    .withMessage("Arabic title must be a string")
    .isLength({ max: 255 })
    .withMessage("Arabic title must not exceed 255 characters"),

  // DESCRIPTION
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),

  // DESCRIPTION AR
  body("description_ar")
    .notEmpty()
    .withMessage("Arabic description is required")
    .isString()
    .withMessage("Arabic description must be a string"),
];

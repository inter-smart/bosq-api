const { body, param } = require("express-validator");

exports.validateLeadGenerationCreate = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ max: 255 })
    .withMessage("Name must not exceed 255 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),

  body("phone")
    .optional()
    .isString()
    .withMessage("Phone must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone must not exceed 20 characters"),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string"),
];

exports.validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer"),
];

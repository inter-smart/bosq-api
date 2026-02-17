const { body, param } = require("express-validator");

exports.validateProductEnquiryCreate = [
  body("product_id")
    .notEmpty()
    .withMessage("Product is required")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),

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

  body("city")
    .optional()
    .isString()
    .withMessage("City must be a string"),

  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  body("message")
    .optional()
    .isString()
    .withMessage("Message must be a string"),
];

exports.validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer"),
];

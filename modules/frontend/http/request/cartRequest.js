const { body, param } = require("express-validator");

exports.addToCartRequest = [
  body("product_id").notEmpty().withMessage("Product ID is required").isInt({ min: 1 }).withMessage("Product ID must be a positive integer"),

  body("variant_id").optional().isInt({ min: 1 }).withMessage("Variant ID must be a positive integer"),

  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),

  body("session_id")
    .optional()
    .isString()
    .withMessage("Session ID must be a string")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Session ID must be between 1 and 255 characters"),
];

exports.updateCartItemRequest = [
  param("itemId").notEmpty().withMessage("Item ID is required").isInt({ min: 1 }).withMessage("Item ID must be a positive integer"),

  body("quantity").notEmpty().withMessage("Quantity is required").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),

  body("variant_id").isInt({ min: 1 }).withMessage("Variant ID must be a positive integer"),
];

exports.removeCartItemRequest = [
  param("itemId").notEmpty().withMessage("Item ID is required").isInt({ min: 1 }).withMessage("Item ID must be a positive integer"),
];

exports.getCartRequest = [
  body("session_id")
    .optional()
    .isString()
    .withMessage("Session ID must be a string")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Session ID must be between 1 and 255 characters"),
];

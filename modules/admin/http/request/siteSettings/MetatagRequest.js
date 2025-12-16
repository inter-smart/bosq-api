const { body, param } = require("express-validator");

const validationRequestPost = [
  // Title & Description
  body("meta_title")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Title must be a string with max 5000 characters"),

  body("meta_title_ar")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Title must be a string with max 5000 characters"),

  body("meta_description")
    .optional()
    .isString()
    .isLength({ max: 10000 })
    .withMessage("Description must be a string with max 10000 characters"),

  body("meta_description_ar")
    .optional()
    .isString()
    .isLength({ max: 10000 })
    .withMessage("Description must be a string with max 10000 characters"),

  body("meta_keywords")
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage("Keywords must be a string with max 255 characters"),

  body("meta_keywords_ar")
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage("Keywords must be a string with max 255 characters"),
];

// ID parameter validation
const validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

module.exports = {
  validationRequestPost,
  validateId,
};

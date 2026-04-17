// validators/productType.validator.js
const { body, param } = require("express-validator");

const isBooleanString = (value) =>
  value === "true" || value === "false" || typeof value === "boolean";

exports.validationRequestPost = [
  body("title").notEmpty().withMessage("Title is required").isString().trim(),

  body("title_ar")
    .notEmpty()
    .withMessage("Arabic title is required")
    .isString()
    .trim(),

  body("description").optional().isString().trim(),

  body("description_ar").optional().isString().trim(),

  body("button").optional().isString().trim(),

  body("button_ar").optional().isString().trim(),

  body("link").optional().isString().trim(),


  body("features").optional().isString().trim(),

  body("features_ar").optional().isString().trim(),

  body("slug")
    .optional()
    .isString()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      "Slug must be lowercase and contain only letters, numbers, and hyphens",
    ),

  body("landing_page_id")
    .optional()
    .isInt()
    .withMessage("Landing page id must be integer")
    .toInt(),

  body("product_variants")
    .optional(),

  body("sort_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a positive integer")
    .toInt(),

  body("status")
    .optional()
    .custom(isBooleanString)
    .withMessage("Status must be true or false")
    .customSanitizer((value) => value === "true" || value === true),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

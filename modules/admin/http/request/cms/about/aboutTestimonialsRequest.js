const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- TITLES ---------- */
  body("title")
    .notEmpty().withMessage("Title is required")
    .isString().withMessage("Title must be a string"),

  body("title_ar")
    .notEmpty().withMessage("Arabic title is required")
    .isString().withMessage("Arabic title must be a string"),

  /* ---------- DESCRIPTION ---------- */
  body("description")
    .notEmpty().withMessage("Description is required")
    .isString().withMessage("Description must be a string"),

  body("description_ar")
    .notEmpty().withMessage("Arabic description is required")
    .isString().withMessage("Arabic description must be a string"),

  /* ---------- NAME ---------- */
  body("name")
    .notEmpty().withMessage("Name is required")
    .isString().withMessage("Name must be a string"),

  body("name_ar")
    .notEmpty().withMessage("Arabic name is required")
    .isString().withMessage("Arabic name must be a string"),

  /* ---------- DESIGNATION ---------- */
  body("designation")
    .notEmpty().withMessage("Designation is required")
    .isString().withMessage("Designation must be a string"),

  body("designation_ar")
    .notEmpty().withMessage("Arabic designation is required")
    .isString().withMessage("Arabic designation must be a string"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  /* ---------- STATUS ---------- */
  body("status")
    .isBoolean()
    .withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer"),
];

const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- TITLE ---------- */
  body("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),

  /* ---------- DESCRIPTION ---------- */
  body("description").notEmpty().withMessage("Description is required").isString().withMessage("Description must be a string"),

  /* ---------- SLUG (AUTO-GENERATED) ---------- */
  body("slug").optional().isString().withMessage("Slug must be a string"),

  /* ---------- DETAILS ---------- */
  body("details").optional().isString().withMessage("Details must be a string"),

  /* ---------- DETAILS POINTS ---------- */
  body("details_points").optional().isString().withMessage("Details points must be a string"),

  /* ---------- ADDITIONAL DETAILS ---------- */
  body("additional_details").optional().isString().withMessage("Additional details must be a string"),

  /* ---------- MEDIA PATH ---------- */
  body("media_path").optional().isString().withMessage("Media path must be a string"),

  /* ---------- STATUS ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

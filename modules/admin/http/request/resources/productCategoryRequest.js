const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- PARENT ---------- */
  body("parent_id").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Parent ID must be a positive integer"),

  /* ---------- NAME ---------- */
  body("name").notEmpty().withMessage("Name is required").isString().withMessage("Name must be a string"),

  /* ---------- SLUG (AUTO-GENERATED) ---------- */
  body("slug").optional().isString().withMessage("Slug must be a string"),

  /* ---------- IMAGE ---------- */
  body("media_path").optional().isString().withMessage("Image URL must be a string"),

  /* ---------- STATUS ---------- */
  body("status").optional().isBoolean().withMessage("Status must be true or false"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order").optional().isInt({ min: 1 }).withMessage("Sort order must be a positive integer"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

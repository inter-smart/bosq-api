const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // COUPON CODE
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ max: 50 })
    .withMessage("Coupon code must not exceed 50 characters"),

  // TITLE AR (OPTIONAL)
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters"),

  // DESCRIPTION (OPTIONAL)
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  // TITLE (OPTIONAL)
  body("title_ar")
    .optional()
    .isString()
    .withMessage("Title AR must be a string")
    .isLength({ max: 255 })
    .withMessage("Title AR must not exceed 255 characters"),

  // DESCRIPTION (OPTIONAL)
  body("description_ar")
    .optional()
    .isString()
    .withMessage("Description AR must be a string"),

  // MEDIA PATH
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  // DISCOUNT TYPE
  body("discount_type")
    .notEmpty()
    .withMessage("Discount type is required")
    .isIn(["percentage", "flat"])
    .withMessage("Discount type must be either percentage or flat"),

  // DISCOUNT VALUE
  body("discount_value")
    .notEmpty()
    .withMessage("Discount value is required")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Discount value must be a valid decimal number")
    .custom((value, { req }) => {
      if (req.body.discount_type === "percentage" && Number(value) > 100) {
        throw new Error("Percentage discount cannot exceed 100");
      }
      return true;
    }),

  // MIN PRODUCT AMOUNT
  body("min_product_amount")
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Minimum product amount must be a valid decimal")
    .custom((value, { req }) => {
      if (req.body.discount_type === "flat" && value && Number(value) <= Number(req.body.discount_value)) {
        throw new Error("Minimum product amount must be greater than discount value for flat discounts");
      }
      return true;
    }),

  // MAX DISCOUNT AMOUNT
  body("max_discount_amount")
    .notEmpty()
    .withMessage("Maximum discount amount is required")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Maximum discount amount must be a valid decimal")
    .custom((value, { req }) => {
      if (req.body.discount_type === "flat" && Number(value) < Number(req.body.discount_value)) {
        throw new Error("Maximum discount must be greater than or equal to discount value for flat discounts");
      }
      return true;
    }),

  // SCOPE TYPE
  body("scope_type")
    .notEmpty()
    .withMessage("Scope type is required")
    .isIn(["common", "category", "product", "variant", "model"])
    .withMessage("Invalid scope type"),

  // SCOPE ID (CONDITIONAL)
  body("scope_id").optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Scope ID must be a valid integer"),

  // USAGE LIMIT TOTAL
  body("usage_limit_total")
    .notEmpty()
    .withMessage("Total usage limit is required")
    .isInt({ min: 1 })
    .withMessage("Total usage limit must be a positive integer"),

  // USAGE LIMIT PER USER
  body("usage_limit_per_user")
    .notEmpty()
    .withMessage("Per-user usage limit is required")
    .isInt({ min: 1 })
    .withMessage("Per-user usage limit must be a positive integer")
    .custom((value, { req }) => {
      if (Number(value) > Number(req.body.usage_limit_total)) {
        throw new Error(
          "Per-user usage limit cannot exceed total usage limit"
        );
      }
      return true;
    }),

  // START DATE
  body("start_at")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  // END DATE
  body("end_at")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_at)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  // STATUS (OPTIONAL)
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be boolean"),
];


exports.validateId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("ID must be a positive integer"),
];
const { body } = require("express-validator");

exports.createAddressRequest = [
  // ============================================
  // BILLING ADDRESS FIELDS (Always Required)
  // ============================================

  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Full name must be between 2 and 255 characters"),

  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Email must be valid").normalizeEmail(),

  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isString()
    .withMessage("Phone must be a string")
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage("Phone must contain only numbers and valid characters"),

  body("state").optional().isString().withMessage("State must be a string").isLength({ min: 2, max: 50 }).withMessage("State slug is invalid"),

  body("streetAddress").notEmpty().withMessage("Street address is required").isString().withMessage("Street address must be a string").trim(),

  body("companyName").optional().isString().withMessage("Company name must be a string").trim(),

  body("apartment").optional().isString().withMessage("Apartment/Suite must be a string").trim(),

  body("orderNotes").optional().isString().withMessage("Order notes must be a string").trim(),

  body("shipToDifferentAddress").optional().isBoolean().withMessage("shipToDifferentAddress must be a boolean"),

  // ============================================
  // SHIPPING ADDRESS FIELDS (Conditional)
  // ============================================

  body("shippingFullName")
    .if(body("shipToDifferentAddress").equals(true))
    .notEmpty()
    .withMessage("Shipping full name is required when shipping to different address")
    .isString()
    .withMessage("Shipping full name must be a string")
    .trim(),

  body("shippingCompanyName")
    .if(body("shipToDifferentAddress").equals(true))
    .optional()
    .isString()
    .withMessage("Shipping company name must be a string")
    .trim(),

  body("shippingState")
    .if(body("shipToDifferentAddress").equals(true))
    .optional()
    .isString()
    .withMessage("Shipping state must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Shipping state slug is invalid"),

  body("shippingStreetAddress")
    .if(body("shipToDifferentAddress").equals(true))
    .notEmpty()
    .withMessage("Shipping street address is required when shipping to different address")
    .isString()
    .withMessage("Shipping street address must be a string")
    .trim(),

  body("shippingApartment")
    .if(body("shipToDifferentAddress").equals(true))
    .optional()
    .isString()
    .withMessage("Shipping apartment/suite must be a string")
    .trim(),
];

exports.updateAddressRequest = [
  // Same validation rules as create, but all fields are optional for update
  // You can customize this based on your needs
  ...exports.createAddressRequest,
];

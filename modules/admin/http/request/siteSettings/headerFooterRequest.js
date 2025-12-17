const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // HEADER LOGO
  body("header_logo_media_path")
    .optional()
    .isString()
    .withMessage("Header logo path must be a string"),

  // FOOTER LOGO
  body("footer_logo_media_path")
    .optional()
    .isString()
    .withMessage("Footer logo path must be a string"),

  // HEADER ALT
  body("header_media_alt")
    .optional()
    .isString()
    .withMessage("Header media alt must be a string")
    .isLength({ max: 255 })
    .withMessage("Header media alt must not exceed 255 characters"),

  body("header_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Header media alt Arabic must be a string")
    .isLength({ max: 255 })
    .withMessage("Header media alt Arabic must not exceed 255 characters"),

  // FOOTER ALT
  body("footer_media_alt")
    .optional()
    .isString()
    .withMessage("Footer media alt must be a string")
    .isLength({ max: 255 })
    .withMessage("Footer media alt must not exceed 255 characters"),

  body("footer_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Footer media alt Arabic must be a string")
    .isLength({ max: 255 })
    .withMessage("Footer media alt Arabic must not exceed 255 characters"),

  // ADDRESS
  body("address").isString().withMessage("Address must be a string"),

  body("address_ar").isString().withMessage("Address Arabic must be a string"),

  body("email").isEmail().withMessage("Email must be valid"),

  // SALES ENQUIRY
  body("sale_enquiry_title")
    .isString()
    .withMessage("Sale enquiry title must be a string"),

  body("sale_enquiry_title_ar")
    .isString()
    .withMessage("Sale enquiry title Arabic must be a string"),

  body("sale_enquiry_email")
    .isEmail()
    .withMessage("Sale enquiry email must be valid"),

  // sales phone
  body("sales_phone_number")
    .isString()
    .withMessage("Phone number must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone number must not exceed 20 characters"),

  body("phone_number")
    .isString()
    .withMessage("Phone number must be a string")
    .isLength({ max: 20 })
    .withMessage("Phone number must not exceed 20 characters"),

  // SUPPORT ENQUIRY
  body("support_enquiry_title")
    .isString()
    .withMessage("Support enquiry title must be a string"),

  body("support_enquiry_title_ar")
    .isString()
    .withMessage("Support enquiry title Arabic must be a string"),

  body("support_email").isEmail().withMessage("Support email must be valid"),

  // NEWSLETTER
  body("news_letter_main_title")
    .isString()
    .withMessage("Newsletter main title must be a string"),

  body("news_letter_main_title_ar")
    .isString()
    .withMessage("Newsletter main title Arabic must be a string"),

  body("news_letter_title")
    .isString()
    .withMessage("Newsletter title must be a string"),

  body("news_letter_title_ar")
    .isString()
    .withMessage("Newsletter title Arabic must be a string"),

  // PO BOX
  body("po_box_number")
    .isString()
    .withMessage("PO Box number must be a string"),
];

/**
 * ID VALIDATION
 */
exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

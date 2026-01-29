const { body, param } = require("express-validator");

// Optional IMAGE fields
const optionalImageFields = [
  "signup_media_path",
  "otp_media_path",
  "create_password_media_path",
  "login_media_path",
  "recover_email_media_path",
  "recover_password_otp_media_path",
  "recover_password_media_path",
];

// Required TEXT fields
const requiredStringFields = [
  "signup_title",
  "signup_title_ar",
  "signup_subtitle",
  "signup_subtitle_ar",

  "otp_title",
  "otp_title_ar",
  "otp_subtitle",
  "otp_subtitle_ar",

  "create_password_title",
  "create_password_title_ar",
  "create_password_subtitle",
  "create_password_subtitle_ar",

  "login_title",
  "login_title_ar",
  "login_subtitle",
  "login_subtitle_ar",

  "recover_email_title",
  "recover_email_title_ar",
  "recover_email_subtitle",
  "recover_email_subtitle_ar",

  "recover_password_otp_title",
  "recover_password_otp_title_ar",
  "recover_password_otp_subtitle",
  "recover_password_otp_subtitle_ar",

  "recover_password_title",
  "recover_password_title_ar",
];

exports.validationRequestPost = [
  // Required string fields
  ...requiredStringFields.map((field) =>
    body(field)
      .notEmpty()
      .withMessage(`${field} is required`)
      .isString()
      .withMessage(`${field} must be a valid string`)
  ),

  // Optional image fields
  ...optionalImageFields.map((field) =>
    body(field)
      .optional({ nullable: true })
      .isString()
      .withMessage(`${field} must be a valid string`)
  ),

  // Boolean status
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be true or false"),
];

// ID Validation
exports.validateId = [
  param("id")
    .notEmpty()
    .withMessage("ID is required")
    .isInt({ min: 1 })
    .withMessage("ID must be a valid positive integer"),
];

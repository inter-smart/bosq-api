const { body } = require("express-validator");

exports.validationRequestPost = [
  // TITLE
  body("title")
    .notEmpty()
    .withMessage("Title is required"),
  body("title_ar")
    .notEmpty()
    .withMessage("Arabic title is required"),

  // FORM TITLE
  body("form_title")
    .notEmpty()
    .withMessage("Form title is required"),
  body("form_title_ar")
    .notEmpty()
    .withMessage("Arabic form title is required"),

  // FORM DESCRIPTION
  body("form_description")
    .notEmpty()
    .withMessage("Form description is required"),
  body("form_description_ar")
    .notEmpty()
    .withMessage("Arabic form description is required"),

  // MEDIA PATH (OPTIONAL)
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  // MEDIA ALT
  body("media_alt")
    .notEmpty()
    .withMessage("Media alt text is required"),
  body("media_alt_ar")
    .notEmpty()
    .withMessage("Arabic media alt text is required"),

  // MEDIA TITLE
  body("media_title")
    .notEmpty()
    .withMessage("Media title is required"),
  body("media_title_ar")
    .notEmpty()
    .withMessage("Arabic media title is required"),

  // MEDIA DESCRIPTION
  body("media_description")
    .notEmpty()
    .withMessage("Media description is required"),
  body("media_description_ar")
    .notEmpty()
    .withMessage("Arabic media description is required"),

  // IFRAME (OPTIONAL)
  body("iframe")
    .optional()
    .isString()
    .withMessage("Iframe must be a string"),

  // EMAIL TITLE
  body("email_title")
    .notEmpty()
    .withMessage("Email title is required"),
  body("email_title_ar")
    .notEmpty()
    .withMessage("Arabic email title is required"),

  // EMAIL ADDRESS
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),

  // PHONE TITLE
  body("phone_title")
    .notEmpty()
    .withMessage("Phone title is required"),
  body("phone_title_ar")
    .notEmpty()
    .withMessage("Arabic phone title is required"),

  // PHONE NUMBER
  body("phone_number")
    .notEmpty()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string"),

  // ADDRESS TITLE
  body("address_title")
    .notEmpty()
    .withMessage("Address title is required"),
  body("address_title_ar")
    .notEmpty()
    .withMessage("Arabic address title is required"),

  // ADDRESS
  body("address")
    .notEmpty()
    .withMessage("Address is required"),

      body("address_ar")
    .notEmpty()
    .withMessage("Address is required"),

  // SOCIAL MEDIA TITLE
  body("social_media_title")
    .notEmpty()
    .withMessage("Social media title is required"),
  body("social_media_title_ar")
    .notEmpty()
    .withMessage("Arabic social media title is required"),
];

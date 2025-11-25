const { body } = require("express-validator");

exports.validationRequestPost = [

  // ABOUT
  body("about_media_path")
    .optional()
    .isString()
    .withMessage("About media path must be a string"),

  body("about_media_alt")
    .optional()
    .isString()
    .withMessage("About media alt must be a string"),

  body("about_media_alt_ar")
    .optional()
    .isString()
    .withMessage("About media alt (Arabic) must be a string"),

  body("about_title")
    .isString()
    .withMessage("About title must be a string"),

  body("about_title_ar")
    .isString()
    .withMessage("About title (Arabic) must be a string"),

  body("about_description")
    .isString()
    .withMessage("About description must be a string"),

  body("about_description_ar")
    .isString()
    .withMessage("About description (Arabic) must be a string"),

  // FEATURED PRODUCTS
  body("featured_title")
    .isString()
    .withMessage("Featured title must be a string"),

  body("featured_title_ar")
    .isString()
    .withMessage("Featured title (Arabic) must be a string"),

  // JOURNEY
  body("journy_title")
    .isString()
    .withMessage("Journey title must be a string"),

  body("journy_title_ar")
    .isString()
    .withMessage("Journey title (Arabic) must be a string"),

  body("journy_description")
    .isString()
    .withMessage("Journey description must be a string"),

  body("journy_description_ar")
    .isString()
    .withMessage("Journey description (Arabic) must be a string"),

  body("journey_media_type")
    .isIn(["image", "video"])
    .withMessage("Journey media type must be image or video"),

  body("journy_media_path")
    .optional()
    .isString()
    .withMessage("Journey media path must be a string"),

  body("journy_media_alt")
    .optional()
    .isString()
    .withMessage("Journey media alt must be a string"),

  body("journy_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Journey media alt (Arabic) must be a string"),

  // PROJECT
  body("project_title")
    .isString()
    .withMessage("Project title must be a string"),

  body("project_title_ar")
    .isString()
    .withMessage("Project title (Arabic) must be a string"),

  // CALCULATOR
  body("calculator_title")
    .isString()
    .withMessage("Calculator title must be a string"),

  body("calculator_title_ar")
    .isString()
    .withMessage("Calculator title (Arabic) must be a string"),

  body("calculator_description")
    .isString()
    .withMessage("Calculator description must be a string"),

  body("calculator_description_ar")
    .isString()
    .withMessage("Calculator description (Arabic) must be a string"),

  body("calculator_media_path")
    .optional()
    .isString()
    .withMessage("Calculator media path must be a string"),

  body("calculator_media_alt")
    .optional()
    .isString()
    .withMessage("Calculator media alt must be a string"),

  body("calculator_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Calculator media alt (Arabic) must be a string"),

  // CUSTOMIZE
  body("customize_title")
    .isString()
    .withMessage("Customize title must be a string"),

  body("customize_title_ar")
    .isString()
    .withMessage("Customize title (Arabic) must be a string"),

  body("customize_description")
    .isString()
    .withMessage("Customize description must be a string"),

  body("customize_description_ar")
    .isString()
    .withMessage("Customize description (Arabic) must be a string"),

  body("customize_media_path")
    .optional()
    .isString()
    .withMessage("Customize media path must be a string"),

  body("customize_media_alt")
    .optional()
    .isString()
    .withMessage("Customize media alt must be a string"),

  body("customize_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Customize media alt (Arabic) must be a string"),

  // FITS
  body("fits_title")
    .isString()
    .withMessage("Fits title must be a string"),

  body("fits_title_ar")
    .isString()
    .withMessage("Fits title (Arabic) must be a string"),

  body("fits_description")
    .isString()
    .withMessage("Fits description must be a string"),

  body("fits_description_ar")
    .isString()
    .withMessage("Fits description (Arabic) must be a string"),

  // BRANDS
  body("brands_title")
    .isString()
    .withMessage("Brands title must be a string"),

  body("brands_title_ar")
    .isString()
    .withMessage("Brands title (Arabic) must be a string"),

  // FORM
  body("form_title")
    .isString()
    .withMessage("Form title must be a string"),

  body("form_title_ar")
    .isString()
    .withMessage("Form title (Arabic) must be a string"),

  body("form_description")
    .isString()
    .withMessage("Form description must be a string"),

  body("form_description_ar")
    .isString()
    .withMessage("Form description (Arabic) must be a string"),

  body("form_media_path")
    .optional()
    .isString()
    .withMessage("Form media path must be a string"),

  body("form_media_alt")
    .optional()
    .isString()
    .withMessage("Form media alt must be a string"),

  body("form_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Form media alt (Arabic) must be a string"),
];

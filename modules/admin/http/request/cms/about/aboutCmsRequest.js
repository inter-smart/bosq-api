const { body } = require("express-validator");

exports.validationRequestPost = [
  // Banner Title (English & Arabic)
  body("banner_title")
    .notEmpty()
    .withMessage("Banner title is required"),
  
  body("banner_title_ar")
    .notEmpty()
    .withMessage("Banner title in Arabic is required"),

  // Banner Description (English & Arabic)
  body("banner_description")
    .notEmpty()
    .withMessage("Banner description is required"),
  
  body("banner_description_ar")
    .notEmpty()
    .withMessage("Banner description in Arabic is required"),

  // Banner Media
  body("banner_media_desktop_path")
    .optional()
    .isString()
    .withMessage("Banner desktop media path must be a string"),

  body("banner_media_mobile_path")
    .optional()
    .isString()
    .withMessage("Banner mobile media path must be a string"),

  body("banner_media_alt")
    .optional()
    .isString()
    .withMessage("Banner media alt must be a string"),
  
  body("banner_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Banner media alt in Arabic must be a string"),

    // buttons
  body("banner_button_text")
    .notEmpty()
    .withMessage("Banner button text is required"),
  
  body("banner_button_text_ar")
    .notEmpty()
    .withMessage("Banner button text in Arabic is required"),
    
  body("banner_button_link")
    .notEmpty()
    .withMessage("Banner button link is required"),
    


  // Journey Title (English & Arabic)
  body("journey_title")
    .notEmpty()
    .withMessage("Journey title is required"),
  
  body("journey_title_ar")
    .notEmpty()
    .withMessage("Journey title in Arabic is required"),

  // Journey Description (English & Arabic)
  body("journey_description")
    .notEmpty()
    .withMessage("Journey description is required"),
  
  body("journey_description_ar")
    .notEmpty()
    .withMessage("Journey description in Arabic is required"),

  // Why Choose Us Title (English & Arabic)
  body("why_choose_us_title")
    .notEmpty()
    .withMessage("Why choose us title is required"),
  
  body("why_choose_us_title_ar")
    .notEmpty()
    .withMessage("Why choose us title in Arabic is required"),

  // Why Choose Us Description (English & Arabic)
  body("why_choose_us_description")
    .notEmpty()
    .withMessage("Why choose us description is required"),
  
  body("why_choose_us_description_ar")
    .notEmpty()
    .withMessage("Why choose us description in Arabic is required"),

  // Testimonial Title (English & Arabic)
  body("testimonial_title")
    .notEmpty()
    .withMessage("Testimonial title is required"),
  
  body("testimonial_title_ar")
    .notEmpty()
    .withMessage("Testimonial title in Arabic is required"),

  // Client Title (English & Arabic)
  body("client_title")
    .notEmpty()
    .withMessage("Client title is required"),
  
  body("client_title_ar")
    .notEmpty()
    .withMessage("Client title in Arabic is required"),

  // News Title (English & Arabic)
  body("news_title")
    .notEmpty()
    .withMessage("News title is required"),
  
  body("news_title_ar")
    .notEmpty()
    .withMessage("News title in Arabic is required"),
];
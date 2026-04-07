const { body } = require("express-validator");

exports.validationRequestPost = [
  body("title").notEmpty().withMessage("Title is required"),
  body("title_ar").notEmpty().withMessage("Arabic title is required"),

  // Banner Title (English & Arabic)
  body("banner_title").notEmpty().withMessage("Banner title is required"),

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

  body("banner_media_type")
    .optional()
    .isIn(["image", "video"])
    .withMessage("Media type must be either 'image' or 'video'"),
  // Banner Media
  body("banner_media_desktop_path")
    .optional()
    .isString()
    .withMessage("Banner desktop media path must be a string"),

  body("banner_media_mobile_path")
    .optional()
    .isString()
    .withMessage("Banner mobile media path must be a string"),

  body("banner_video_thumbnail_path")
    .optional()
    .isString()
    .withMessage("Banner video thumbnail path must be a string"),

  body("banner_media_alt")
    .optional()
    .isString()
    .withMessage("Banner media alt must be a string"),

  body("banner_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Banner media alt in Arabic must be a string"),

  // Banner Buttons
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
  body("journey_title").notEmpty().withMessage("Journey title is required"),

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

  // Journey Media Paths (Images 1, 2, 3) - REQUIRED
  body("journey_one_media_path")
    .optional()
    .isString()
    .withMessage("Journey image 1 is required"),

  body("journey_two_media_path")
    .optional()
    .isString()
    .withMessage("Journey image 2 is required"),

  body("journey_three_media_path")
    .optional()
    .isString()
    .withMessage("Journey image 3 is required"),

  // Journey Media Alt Texts (Image 1 - English & Arabic)
  body("journey_one_media_alt")
    .optional()
    .isString()
    .withMessage("Journey one media alt must be a string"),

  body("journey_one_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Journey one media alt in Arabic must be a string"),

  // Journey Media Alt Texts (Image 2 - English & Arabic)
  body("journey_two_media_alt")
    .optional()
    .isString()
    .withMessage("Journey two media alt must be a string"),

  body("journey_two_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Journey two media alt in Arabic must be a string"),

  // Journey Media Alt Texts (Image 3 - English & Arabic)
  body("journey_three_media_alt")
    .optional()
    .isString()
    .withMessage("Journey three media alt must be a string"),

  body("journey_three_media_alt_ar")
    .optional()
    .isString()
    .withMessage("Journey three media alt in Arabic must be a string"),

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
  body("client_title").notEmpty().withMessage("Client title is required"),

  body("client_title_ar")
    .notEmpty()
    .withMessage("Client title in Arabic is required"),

  // News Title (English & Arabic)
  body("news_title").notEmpty().withMessage("News title is required"),

  body("news_title_ar")
    .notEmpty()
    .withMessage("News title in Arabic is required"),
];

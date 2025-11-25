const { body } = require("express-validator");

exports.validationRequestPost = [
  // Title
  body("title")
    .notEmpty()
    .withMessage("Title is required"),

  body("title_ar")
    .notEmpty()
    .withMessage("Arabic title is required"),

  // Banner Title
  body("banner_title")
    .notEmpty()
    .withMessage("Banner title is required"),

  body("banner_title_ar")
    .notEmpty()
    .withMessage("Arabic banner title is required"),

  // Banner Description
  body("banner_description")
    .notEmpty()
    .withMessage("Banner description is required"),

  body("banner_description_ar")
    .notEmpty()
    .withMessage("Arabic banner description is required"),

  // Media desktop path (optional)
  body("media_desktop_path")
    .optional()
    .isString()
    .withMessage("Desktop media path must be a string"),

  // Media mobile path (optional)
  body("media_mobile_path")
    .optional()
    .isString()
    .withMessage("Mobile media path must be a string"),

  // Media ALT
  body("media_alt")
    .optional()
    .isString()
    .withMessage("Media alt must be a string"),

  body("media_alt_ar")
    .optional()
    .isString()
    .withMessage("Arabic media alt must be a string"),

  // Popular Blogs Title (optional)
  body("popular_blogs_title")
    .optional()
    .isString()
    .withMessage("Popular blogs title must be a string"),

  body("popular_blogs_title_ar")
    .optional()
    .isString()
    .withMessage("Arabic popular blogs title must be a string"),

  // Related Blogs Title (optional)
  body("related_blogs_title")
    .optional()
    .isString()
    .withMessage("Related blogs title must be a string"),

  body("related_blogs_title_ar")
    .optional()
    .isString()
    .withMessage("Arabic related blogs title must be a string"),
];

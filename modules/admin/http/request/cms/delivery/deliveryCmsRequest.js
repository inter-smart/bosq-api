const { body, param } = require("express-validator");

exports.validationRequestPost = [
  // Title
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),

  body("title_ar")
    .notEmpty()
    .withMessage("Title (Arabic) is required")
    .isString()
    .withMessage("Title (Arabic) must be a string"),

  // Banner title
  body("banner_title")
    .notEmpty()
    .withMessage("Banner title is required")
    .isString()
    .withMessage("Banner title must be a string"),

  body("banner_title_ar")
    .notEmpty()
    .withMessage("Banner title (Arabic) is required")
    .isString()
    .withMessage("Banner title (Arabic) must be a string"),

  // Delivery time title
  body("delivery_time_title")
    .notEmpty()
    .withMessage("Delivery time title is required")
    .isString()
    .withMessage("Delivery time title must be a string"),

  body("delivery_time_title_ar")
    .notEmpty()
    .withMessage("Delivery time title (Arabic) is required")
    .isString()
    .withMessage("Delivery time title (Arabic) must be a string"),

  // Delivery time subtitle (TEXT fields)
  body("delivery_time_subtitle")
    .notEmpty()
    .withMessage("Delivery time subtitle is required")
    .isString()
    .withMessage("Delivery time subtitle must be a string"),

  body("delivery_time_subtitle_ar")
    .notEmpty()
    .withMessage("Delivery time subtitle (Arabic) is required")
    .isString()
    .withMessage("Delivery time subtitle (Arabic) must be a string"),

  // Optional banner media
  body("banner_media_mobile_path")
    .optional({ nullable: true })
    .isString()
    .withMessage("Mobile banner media path must be a string"),

  body("banner_media_mobile_path_ar")
    .optional({ nullable: true })
    .isString()
    .withMessage("Mobile banner media path (AR) must be a string"),

  body("banner_media_desktop_path")
    .optional({ nullable: true })
    .isString()
    .withMessage("Desktop banner media path must be a string"),

  body("banner_media_desktop_path_ar")
    .optional({ nullable: true })
    .isString()
    .withMessage("Desktop banner media path (AR) must be a string"),

  // Optional banner alt text
  body("banner_media_alt")
    .optional({ nullable: true })
    .isString()
    .withMessage("Banner alt text must be a string"),

  body("banner_media_alt_ar")
    .optional({ nullable: true })
    .isString()
    .withMessage("Banner alt text (Arabic) must be a string"),

  // Optional delivery media
  body("delivery_media_path")
    .optional({ nullable: true })
    .isString()
    .withMessage("Delivery media path must be a string"),

  // Optional delivery media alt text
  body("delivery_media_alt")
    .optional({ nullable: true })
    .isString()
    .withMessage("Delivery media alt text must be a string"),

  body("delivery_media_alt_ar")
    .optional({ nullable: true })
    .isString()
    .withMessage("Delivery media alt text (Arabic) must be a string"),

];


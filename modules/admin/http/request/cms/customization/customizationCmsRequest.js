const { body } = require("express-validator");

exports.validationRequestPost = [
  // Title (English & Arabic)
  body("title").optional().isString().withMessage("Title must be a string"),
  body("title_ar").optional().isString().withMessage("Arabic title must be a string"),

  // Banner
  body("banner_title").optional().isString().withMessage("Banner title must be a string"),
  body("banner_title_ar").optional().isString().withMessage("Banner title in Arabic must be a string"),

  body("banner_description").optional().isString().withMessage("Banner description must be a string"),
  body("banner_description_ar").optional().isString().withMessage("Banner description in Arabic must be a string"),

  body("banner_media_type").optional().isIn(["image", "video"]).withMessage("Banner media type must be either 'image' or 'video'"),

  body("banner_media_desktop_path").optional().isString().withMessage("Banner desktop media path must be a string"),
  body("banner_media_desktop_path_ar").optional().isString().withMessage("Banner desktop media path (AR) must be a string"),
  body("banner_media_mobile_path").optional().isString().withMessage("Banner mobile media path must be a string"),
  body("banner_media_mobile_path_ar").optional().isString().withMessage("Banner mobile media path (AR) must be a string"),
  body("banner_media_alt").optional().isString().withMessage("Banner media alt must be a string"),
  body("banner_media_alt_ar").optional().isString().withMessage("Banner media alt in Arabic must be a string"),
  body("banner_media_thumbnail").optional().isString().withMessage("Banner thumbnail must be a string"),

  // Process Section
  body("process_title").optional().isString().withMessage("Process title must be a string"),
  body("process_title_ar").optional().isString().withMessage("Process title in Arabic must be a string"),
  body("process_description").optional().isString().withMessage("Process description must be a string"),
  body("process_description_ar").optional().isString().withMessage("Process description in Arabic must be a string"),
  body("process_media_path").optional().isString().withMessage("Process media path must be a string"),
  body("process_media_alt").optional().isString().withMessage("Process media alt must be a string"),
  body("process_media_alt_ar").optional().isString().withMessage("Process media alt in Arabic must be a string"),

  // Options Section
  body("options_title").optional().isString().withMessage("Options title must be a string"),
  body("options_title_ar").optional().isString().withMessage("Options title in Arabic must be a string"),
  body("options_description").optional().isString().withMessage("Options description must be a string"),
  body("options_description_ar").optional().isString().withMessage("Options description in Arabic must be a string"),

  // Form Section
  body("form_title").optional().isString().withMessage("Form title must be a string"),
  body("form_title_ar").optional().isString().withMessage("Form title in Arabic must be a string"),
  body("form_description").optional().isString().withMessage("Form description must be a string"),
  body("form_description_ar").optional().isString().withMessage("Form description in Arabic must be a string"),

  body("form_media_path").optional().isString().withMessage("Form media path must be a string"),
  body("form_media_alt").optional().isString().withMessage("Form media alt must be a string"),
  body("form_media_alt_ar").optional().isString().withMessage("Form media alt in Arabic must be a string"),
];

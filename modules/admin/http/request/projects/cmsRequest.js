const { body } = require("express-validator");

exports.validationRequest = [
  /* ---------- TITLE ---------- */
  body("title").optional().isString().withMessage("Title must be a string"),

  body("title_ar").optional().isString().withMessage("Arabic title must be a string"),

  /* ---------- DESCRIPTION ---------- */
  body("description").optional().isString().withMessage("Description must be a string"),

  body("description_ar").optional().isString().withMessage("Arabic description must be a string"),

  /* ---------- BANNER MEDIA ---------- */
  body("banner_media_desktop_path").optional().isString().withMessage("Banner desktop media path must be a string"),

  body("banner_media_desktop_path_ar").optional().isString().withMessage("Banner desktop media path (AR) must be a string"),

  body("banner_media_mobile_path").optional().isString().withMessage("Banner mobile media path must be a string"),

  body("banner_media_mobile_path_ar").optional().isString().withMessage("Banner mobile media path (AR) must be a string"),

  body("banner_media_alt").optional().isString().withMessage("Banner media alt must be a string"),

  body("banner_media_alt_ar").optional().isString().withMessage("Banner media alt Arabic must be a string"),

  body("banner_media_type").optional().isIn(["image", "video"]).withMessage("Banner media type must be either 'image' or 'video'"),

  /* ---------- FORM SECTION ---------- */
  body("form_title").optional().isString().withMessage("Form title must be a string"),

  body("form_title_ar").optional().isString().withMessage("Form title Arabic must be a string"),

  body("form_description").optional().isString().withMessage("Form description must be a string"),

  body("form_description_ar").optional().isString().withMessage("Form description Arabic must be a string"),

  body("form_media_path").optional().isString().withMessage("Form media path must be a string"),

  body("form_media_alt").optional().isString().withMessage("Form media alt must be a string"),

  body("form_media_alt_ar").optional().isString().withMessage("Form media alt Arabic must be a string"),
];

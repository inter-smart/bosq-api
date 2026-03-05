const { body } = require("express-validator");

exports.validationRequestPost = [
  body("title").optional().isString().withMessage("Title must be a string"),
  body("title_ar").optional().isString().withMessage("Arabic title must be a string"),
  body("media_type").optional().isIn(["image", "video"]).withMessage("Media type must be either 'image' or 'video'"),
  body("media_desktop_path").optional().isString().withMessage("Banner desktop media path must be a string"),
  body("media_desktop_path_ar").optional().isString().withMessage("Banner desktop media path must be a string"),
  body("media_mobile_path").optional().isString().withMessage("Banner mobile media path must be a string"),
  body("media_mobile_path_ar").optional().isString().withMessage("Banner mobile media path must be a string"),
  body("media_alt").optional().isString().withMessage("Banner media alt must be a string"),
  body("media_alt_ar").optional().isString().withMessage("Banner media alt in Arabic must be a string"),
  body("description").optional().isString().withMessage("Description must be a string"),
  body("description_ar").optional().isString().withMessage("Description in Arabic must be a string"),
];

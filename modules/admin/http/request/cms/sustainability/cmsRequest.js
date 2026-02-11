const { body, param } = require("express-validator");

exports.validateRequest = [
  /* ---------- TITLE ---------- */
  body("title").optional().isString().withMessage("Title must be a string"),
  body("title_ar").optional().isString().withMessage("Arabic title must be a string"),

  /* ---------- BANNER MEDIA ---------- */
  body("banner_media_desktop_path").optional().isString().withMessage("Banner desktop media path must be a string"),

  body("banner_media_mobile_path").optional().isString().withMessage("Banner mobile media path must be a string"),

  body("banner_media_alt").optional().isString().withMessage("Banner alt text must be a string"),

  body("banner_media_alt_ar").optional().isString().withMessage("Arabic banner alt text must be a string"),

  body("banner_media_type").optional().isIn(["image", "video"]).withMessage("Banner media type must be either 'image' or 'video'"),

  /* ---------- SECTION 1 TITLE ---------- */
  body("section1_title").optional().isString().withMessage("Section 1 title must be a string"),

  body("section1_title_ar").optional().isString().withMessage("Section 1 Arabic title must be a string"),

  /* ---------- SECTION 1 DESCRIPTION ---------- */
  body("section1_description").optional().isString().withMessage("Section 1 description must be a string"),

  body("section1_description_ar").optional().isString().withMessage("Section 1 Arabic description must be a string"),

  /* ---------- SECTION 1 MEDIA ---------- */
  body("section1_media_path").optional().isString().withMessage("Section 1 media path must be a string"),

  body("section1_media_alt").optional().isString().withMessage("Section 1 media alt text must be a string"),

  body("section1_media_alt_ar").optional().isString().withMessage("Section 1 media Arabic alt text must be a string"),

];

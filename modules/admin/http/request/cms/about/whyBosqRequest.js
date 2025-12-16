const { body, param } = require("express-validator");

exports.validationRequestPost = [
  /* ---------- MEDIA (ONLY THESE ARE OPTIONAL) ---------- */
  body("media_path")
    .optional()
    .isString()
    .withMessage("Media path must be a string"),

  body("media_alt")
    .optional()
    .isString()
    .withMessage("Media alt must be a string"),

  /* ---------- MEDIA ARABIC ---------- */
  body("media_alt_ar")
    .optional()
    .isString()
    .withMessage("Media alt Arabic must be a string"),

  /* ---------- ICON ---------- */
  body("icon_media_path")
    .optional()
    .isString()
    .withMessage("Icon must be a string"),

  body("icon_media_alt").isString().withMessage("Icon alt must be a string"),

  body("icon_media_alt_ar")
    .isString()
    .withMessage("Icon alt Arabic must be a string"),
    
  /* ---------- TITLES ---------- */
  body("title").isString().withMessage("Title must be a string"),

  body("title_ar").isString().withMessage("Title Arabic must be a string"),

  /* ---------- SUBTITLES ---------- */
  body("subtitle").isString().withMessage("Subtitle must be a string"),

  body("subtitle_ar")
    .isString()
    .withMessage("Subtitle Arabic must be a string"),

  /* ---------- DESCRIPTION ---------- */
  body("description").isString().withMessage("Description must be a string"),

  body("description_ar")
    .isString()
    .withMessage("Description Arabic must be a string"),

  /* ---------- SORT ORDER ---------- */
  body("sort_order")
    .isInt({ min: 1 })
    .withMessage("Sort order must be a positive integer"),

  /* ---------- STATUS ---------- */
  body("status").isBoolean().withMessage("Status must be true or false"),
];

exports.validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

const { body } = require("express-validator");

exports.validationRequestPost = [
  // Login Title (English & Arabic)
  body("login_title").notEmpty().withMessage("Login title is required").isString().withMessage("Login title must be a string"),

  body("login_title_ar").notEmpty().withMessage("Login title in Arabic is required").isString().withMessage("Login title in Arabic must be a string"),

  // Signup Title (English & Arabic)
  body("signup_title").notEmpty().withMessage("Signup title is required").isString().withMessage("Signup title must be a string"),

  body("signup_title_ar")
    .notEmpty()
    .withMessage("Signup title in Arabic is required")
    .isString()
    .withMessage("Signup title in Arabic must be a string"),

  // Login Media
  body("login_media_desktop_path").optional().isString().withMessage("Login media desktop path must be a string"),

  body("login_media_alt").optional().isString().withMessage("Login media alt must be a string"),

  body("login_media_alt_ar").optional().isString().withMessage("Login media alt in Arabic must be a string"),

  // Signup Media
  body("signup_media_desktop_path").optional().isString().withMessage("Signup media desktop path must be a string"),

  body("signup_media_alt").optional().isString().withMessage("Signup media alt must be a string"),

  body("signup_media_alt_ar").optional().isString().withMessage("Signup media alt in Arabic must be a string"),
];

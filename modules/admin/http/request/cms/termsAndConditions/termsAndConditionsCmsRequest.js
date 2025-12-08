const { body } = require("express-validator");

exports.validationRequestPost = [

  // ABOUT
    body("title")
    .isString()
    .withMessage("Title must be a string"),

    body("title_ar")
    .isString()
    .withMessage("Title Arabic must be a string"),

    body("description")
    .isString()
    .withMessage("Description must be a string"),

    body("description_ar")
    .isString()
    .withMessage("Description Arabic must be a string"),

    body("faq_title")
    .isString()
    .withMessage("Faq title must be a string"),

    body("faq_title_ar")
    .isString()
    .withMessage("Faq title Arabic must be a string"),
]
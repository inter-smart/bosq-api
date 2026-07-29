const { body, param } = require("express-validator");

exports.validationRequestUpdate = [
  /* ---------- OPTIONAL META FIELDS ---------- */
  body("meta_title").optional({ nullable: true }).isString().withMessage("Meta title must be a string"),
  body("meta_title_ar").optional({ nullable: true }).isString().withMessage("Meta title (AR) must be a string"),
  body("meta_description").optional({ nullable: true }).isString().withMessage("Meta description must be a string"),
  body("meta_description_ar").optional({ nullable: true }).isString().withMessage("Meta description (AR) must be a string"),
  body("meta_keywords").optional({ nullable: true }).isString().withMessage("Meta keywords must be a string"),
  body("meta_keywords_ar").optional({ nullable: true }).isString().withMessage("Meta keywords (AR) must be a string"),
  body("other_meta").optional({ nullable: true }).isString().withMessage("Other meta must be a string"),
  body("other_meta_ar").optional({ nullable: true }).isString().withMessage("Other meta (AR) must be a string"),
];

exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];

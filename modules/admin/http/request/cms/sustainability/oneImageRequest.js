const { body, param } = require("express-validator");

exports.validateRequest = [
  body("title").optional().isString().withMessage("Title must be a string"),
  body("title_ar").optional().isString().withMessage("Arabic title must be a string"),
  body("description").optional().isString().withMessage("Description must be a string"),
  body("description_ar").optional().isString().withMessage("Arabic description must be a string"),
  body("points").optional().isString().withMessage("Points must be an array"),
  body("points_ar").optional().isString().withMessage("Arabic points must be an array"),
  body("image_path").optional().isString().withMessage("Image path must be a string"),
  body("image_alt").optional().isString().withMessage("Image alt must be a string"),
  body("image_alt_ar").optional().isString().withMessage("Arabic image alt must be a string"),
];

/* ---------- ID VALIDATION ---------- */
exports.validateId = [param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer")];
